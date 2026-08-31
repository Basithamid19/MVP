import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redactPII } from '@/lib/pii-filter';
import {
  hasConfirmedBookingBetween,
  negotiationQuotes,
  negotiationSummary,
  requestSummaries,
  requestSummary,
  CONFIRMED_PAYMENT_STATUSES,
  ACTIVE_BOOKING_STATUSES,
} from '@/lib/chat-access';

export const dynamic = 'force-dynamic';

// ===========================================================================
// API SHAPES (20260710 in-inbox negotiation) — clients build against these.
//
// GET /api/chat?threadId=…  →  OBJECT (was: bare array of messages)
//   {
//     messages: Array<{
//       id, threadId, senderId, content, createdAt,
//       imageUrl?: string | null,          // absent on pre-20260701 DBs
//       kind: 'text' | 'offer' | 'system', // always present; 'text' on pre-20260710 DBs
//       payload: object | null             // structured card data, see below
//     }>,
//     textUnlocked: boolean,   // free-text composer allowed? (admin, or the pair
//                              // has a confirmed/paid booking). Reads are ALWAYS
//                              // allowed for participants now — no more 403.
//     negotiation: Negotiation | null,
//     request: RequestSummary | null   // NEW (20260711)
//   }
//
// GET /api/chat  (thread list)  →  ARRAY (unchanged container) of
//   {
//     id, otherParticipant: { id, name, image, role },
//     lastMessage: { id, senderId, content, createdAt, kind } | null,
//     category, createdAt, unreadCount,
//     requestId: string,                 // NEW — the thread's ServiceRequest
//     textUnlocked: boolean,             // NEW — same meaning as above
//     negotiation: Negotiation | null,   // NEW
//     request: RequestSummary | null     // NEW (20260711)
//   }
//   Threads appear from the moment the conversation exists: the FIRST QUOTE for
//   an open request, or REQUEST CREATION for a direct request (which opens the
//   thread before any quote — /api/requests POST). Previously anything without a
//   paid booking was filtered out of the inbox entirely.
//   One row per THREAD, not per counterpart: a request is a negotiation is a
//   conversation, so two requests with the same pro are two rows. Only true
//   duplicates of the same (counterpart, requestId) collapse — preferring the
//   thread that has messages, then the most recent activity.
//
// RequestSummary — the ServiceRequest the thread is anchored on. Present on both
// shapes so the conversation can show what the job is before a single message
// exists (this is the ONLY content a fresh direct-request thread has):
//   { id, description, budget, dateWindow, isUrgent, status, categoryName }
//   Resolved via lib/chat-access.requestSummaries, which degrades to null on an
//   orphaned requestId or a DB behind on migrations.
//
// Negotiation (latest quote for the thread's request + provider — PENDING wins,
// else the newest, so settled deals keep their figure):
//   { quoteId, requestId, price, currentPrice, effectivePrice, turn, status,
//     expiresAt, providerUserId, estimatedHours, createdAt }
//   • price = the provider's original ask, currentPrice = latest counter (null
//     if never countered), effectivePrice = currentPrice ?? price.
//   • turn = 'customer' | 'provider' — whose accept/counter is pending.
//   • estimatedHours/createdAt exist so the client can SYNTHESIZE an offer card
//     from state when the kind='offer' ChatMessage is missing (the card writes
//     are best-effort). A live negotiation must never be unactionable.
//
// ChatMessage.payload:
//   kind='offer'  → { action: 'offer'|'counter'|'accept'|'decline', quoteId,
//                     price, estimatedHours|null, expiresAt(ISO)|null,
//                     note|null (already redactPII'd), by: 'customer'|'provider' }
//   kind='system' → { event: 'booking_created'|'deposit_paid'|'quote_auto_declined', … }
//   `content` mirrors the payload as plain text ('[counter] €45', '[system]
//   booking_created') so any client that only knows about text still shows
//   something sane.
//
// Offer/system messages are written server-side by /api/quotes and the Stripe
// webhook ONLY. POST /api/chat always forces kind='text'.
// ===========================================================================

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('threadId');
    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    // If threadId provided, return messages for that thread
    if (threadId) {
      // Authorization: participants is the canonical check. Load participant
      // IDs first and allow the caller if they appear in that list.
      const thread = await prisma.chatThread.findUnique({
        where: { id: threadId },
        select: {
          requestId: true,
          participants: { select: { id: true, role: true } },
        },
      }).catch(() => null);

      if (!thread) {
        return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
      }

      let isParticipant = thread.participants.some(p => p.id === userId);
      let authorized = role === 'ADMIN' || isParticipant;

      // Fallback compatibility: legacy threads created via the scalar-only
      // path in quotes/route.ts may have been persisted without populating
      // the participants relation. Honour customerId/providerId scalars when
      // the participants check fails and those columns exist.
      if (!authorized) {
        try {
          const scalar: any = await prisma.chatThread.findUnique({
            where: { id: threadId },
            select: { customerId: true, providerId: true } as any,
          });
          if (scalar && (scalar.customerId === userId || scalar.providerId === userId)) {
            isParticipant = true;
            authorized = true;
          }
        } catch {
          // customerId/providerId columns missing on this DB — participants
          // was the only source of truth and already rejected this caller.
        }
      }

      if (!authorized) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Pair identity: needed both for the text-unlock check and to resolve
      // the thread's live negotiation. Legacy threads may lack the
      // participants relation — fall back to the scalar customerId/providerId
      // columns for the pair.
      const pairIds = thread.participants.map(p => p.id);
      let providerUserId: string | null =
        thread.participants.find(p => p.role === 'PROVIDER')?.id ?? null;
      if (pairIds.length < 2 || !providerUserId) {
        try {
          const scalar: any = await prisma.chatThread.findUnique({
            where: { id: threadId },
            select: { customerId: true, providerId: true } as any,
          });
          for (const pid of [scalar?.customerId, scalar?.providerId]) {
            if (pid && !pairIds.includes(pid)) pairIds.push(pid);
          }
          providerUserId = providerUserId ?? scalar?.providerId ?? null;
        } catch { /* scalar columns missing on this DB */ }
      }

      // Reading a thread you're in is ALWAYS allowed now: the negotiation
      // (offer → counter → accept) happens inside the conversation, so the
      // old "no booking, no thread" 403 would have hidden the very cards the
      // customer has to act on. The deposit gate moved to free text only —
      // textUnlocked below — which is what actually protects against
      // off-platform leakage.
      const textUnlocked = role === 'ADMIN' ? true : await hasConfirmedBookingBetween(pairIds);

      // Explicit select: imageUrl (20260701*) and kind/payload (20260710) may
      // not exist in the DB yet — fall back down the ladder rather than
      // failing the poll. Pre-20260710 rows all read as kind 'text'.
      const MSG_SELECT_FULL = {
        id: true, threadId: true, senderId: true, content: true,
        imageUrl: true, kind: true, payload: true, createdAt: true,
      } as const;
      const MSG_SELECT_NO_KIND = {
        id: true, threadId: true, senderId: true, content: true, imageUrl: true, createdAt: true,
      } as const;
      const MSG_SELECT_MINIMAL = {
        id: true, threadId: true, senderId: true, content: true, createdAt: true,
      } as const;

      const rawMessages: any[] = await prisma.chatMessage.findMany({
        where: { threadId },
        select: MSG_SELECT_FULL,
        orderBy: { createdAt: 'asc' },
      }).catch(async (err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('payload') || msg.includes('kind') || msg.includes('column') || msg.includes('P2022')) {
          return prisma.chatMessage.findMany({
            where: { threadId },
            select: MSG_SELECT_NO_KIND,
            orderBy: { createdAt: 'asc' },
          }).catch(async (err2: unknown) => {
            const msg2 = err2 instanceof Error ? err2.message : String(err2);
            if (msg2.includes('imageUrl') || msg2.includes('column') || msg2.includes('P2022')) {
              return prisma.chatMessage.findMany({
                where: { threadId },
                select: MSG_SELECT_MINIMAL,
                orderBy: { createdAt: 'asc' },
              });
            }
            throw err2;
          });
        }
        throw err;
      });

      // Normalise so clients never have to branch on migration state.
      const messages = rawMessages.map(m => ({
        ...m,
        kind: m.kind ?? 'text',
        payload: m.payload ?? null,
      }));

      const negotiation = await negotiationSummary(thread.requestId, providerUserId);

      // The job this conversation is about. For a direct-request thread this is
      // the only content there is until the provider quotes, so it carries the
      // whole conversation; null (orphaned requestId / pre-migration DB) just
      // hides the pinned card.
      const requestContext = await requestSummary(thread.requestId);

      // Viewing the thread marks the counterpart's messages as read. Fire and
      // forget: a pre-20260709 DB without readAt must not fail the poll, and
      // the response doesn't depend on the write landing. Participants only —
      // an admin opening a thread for moderation must not wipe the actual
      // recipient's unread state (senderId != admin matches every message).
      if (isParticipant) {
        prisma.chatMessage.updateMany({
          where: { threadId, senderId: { not: userId }, readAt: null },
          data: { readAt: new Date() },
        }).catch(() => { /* readAt column missing on this DB */ });
      }

      return NextResponse.json({ messages, textUnlocked, negotiation, request: requestContext });
    }

    // Otherwise, return all threads for the current user

    // Safe select: never references customerId/providerId/isLocked which may not
    // exist in the DB if migration 20260403000000_add_chat_thread_dedup hasn't run.
    // `withKind` toggles the 20260710 ChatMessage.kind column so the inbox can
    // label offer previews; dropped wholesale on a DB that predates it.
    const threadSelect = (withKind: boolean) => ({
      id: true,
      requestId: true,
      createdAt: true,
      participants: {
        select: { id: true, name: true, image: true, role: true },
      },
      // Explicit column list: an implicit SELECT * here would break on DBs
      // that haven't run the 20260701* imageUrl migration yet. The preview
      // only needs sender/content/kind/timestamp anyway.
      messages: {
        select: withKind
          ? { id: true, senderId: true, content: true, kind: true, createdAt: true }
          : { id: true, senderId: true, content: true, createdAt: true },
        orderBy: { createdAt: 'desc' as const },
        take: 1,
      },
      request: {
        select: {
          category: { select: { name: true } },
        },
      },
    } as any);

    // Primary query: tries customerId/providerId scalar WHERE clauses.
    // Falls back to participants-only select if the migration hasn't run yet.
    const loadThreads = (withKind: boolean): Promise<any[]> =>
      prisma.chatThread.findMany({
        where: {
          OR: [
            { customerId: userId },
            { providerId: userId },
            { participants: { some: { id: userId } } },
          ],
        },
        select: threadSelect(withKind),
        orderBy: { createdAt: 'desc' },
      }).catch(async (err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes('customerId') || msg.includes('providerId') ||
          msg.includes('column') || msg.includes('P2022')
        ) {
          console.warn('[chat GET] scalar columns missing, falling back to participants lookup');
          return prisma.chatThread.findMany({
            where: { participants: { some: { id: userId } } },
            select: threadSelect(withKind),
            orderBy: { createdAt: 'desc' },
          });
        }
        throw err;
      });

    const threads: any[] = await loadThreads(true).catch(async (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('kind') || msg.includes('column') || msg.includes('P2022')) {
        console.warn('[chat GET] ChatMessage.kind missing, loading threads without it');
        return loadThreads(false);
      }
      throw err;
    });

    // Rank threads so the meaningful one per counterpart wins: threads with
    // messages outrank empty ones, then most recent activity first.
    const ranked = threads.sort((a, b) => {
      const aHas = a.messages.length > 0;
      const bHas = b.messages.length > 0;
      if (aHas !== bHas) return aHas ? -1 : 1;
      const aDate = a.messages[0]?.createdAt ?? a.createdAt;
      const bDate = b.messages[0]?.createdAt ?? b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

    // Which counterparts the caller has a CONFIRMED booking with (deposit
    // paid / job in progress or completed). This used to FILTER the inbox —
    // everything unpaid was hidden — but negotiation now lives in the
    // conversation, so threads must show up from the first quote onward. The
    // set is kept for the per-thread `textUnlocked` flag: free text still
    // requires a paid deposit. Admin: everything unlocked.
    let confirmedPartnerIds: Set<string> | null = null;
    if (role !== 'ADMIN') {
      const confirmedBookings = await prisma.booking.findMany({
        where: {
          status: { not: 'CANCELED' },
          OR: [
            { customer: { userId } },
            { provider: { userId } },
          ],
          AND: [{
            OR: [
              { payment: { status: { in: CONFIRMED_PAYMENT_STATUSES } } },
              { status: { in: ACTIVE_BOOKING_STATUSES as any } },
            ],
          }],
        },
        select: {
          customer: { select: { userId: true } },
          provider: { select: { userId: true } },
        },
      });
      confirmedPartnerIds = new Set<string>();
      for (const b of confirmedBookings) {
        for (const pid of [b.customer?.userId, b.provider?.userId]) {
          if (pid && pid !== userId) confirmedPartnerIds.add(pid);
        }
      }
    }

    // Collapse only TRUE duplicates: several ChatThread rows for the same
    // (counterpart, requestId). A request is a negotiation is a conversation, so
    // two different requests with the same pro are two rows — collapsing on the
    // counterpart alone used to surface whichever thread ranked first and HIDE
    // the one holding the live negotiation, so a deep link landed on an empty
    // shell with no way back. Within a duplicate group `ranked` already put the
    // thread that has messages (then the most recent) first.
    const seen = new Set<string>();
    const result: any[] = [];
    for (const t of ranked) {
      const otherP = t.participants.find((p: any) => p.id !== userId) ?? t.participants[0] ?? null;
      if (!otherP) continue;
      const dedupeKey = `${otherP.id}::${t.requestId ?? t.id}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      const last = t.messages[0] ?? null;
      result.push({
        id: t.id,
        requestId: t.requestId,
        otherParticipant: otherP,
        lastMessage: last ? { ...last, kind: last.kind ?? 'text' } : null,
        category: t.request?.category?.name ?? 'Service',
        createdAt: t.createdAt,
        textUnlocked: confirmedPartnerIds ? confirmedPartnerIds.has(otherP.id) : true,
        // Both filled in below by one batched query each for all surfaced threads.
        negotiation: null as any,
        request: null as any,
        // Internal: which participant is the provider, for negotiation matching.
        _providerUserId:
          t.participants.find((p: any) => p.role === 'PROVIDER')?.id ??
          (role === 'PROVIDER' ? userId : otherP.id),
      });
    }

    // Live negotiation per surfaced thread. One batched query for every
    // request id (never N+1); degrades to null on a pre-20260710 DB via
    // negotiationQuotes' own fallback.
    if (result.length) {
      const quotes = await negotiationQuotes(result.map(r => r.requestId));
      // The job each row is about — one batched query, so a fresh
      // direct-request row can say what it's for before any message exists.
      const requests = await requestSummaries(result.map(r => r.requestId));
      for (const r of result) {
        r.negotiation =
          quotes.find(q => q.requestId === r.requestId && q.providerUserId === r._providerUserId) ??
          null;
        r.request = requests.get(r.requestId) ?? null;
        delete r._providerUserId;
      }
    }

    // Unread counts — one grouped query for all surfaced threads. A DB that
    // hasn't run the 20260709 readAt migration throws here; degrade to zero
    // counts (no badges) rather than failing the inbox.
    const unreadByThread = new Map<string, number>();
    if (result.length) {
      const groups = await prisma.chatMessage.groupBy({
        by: ['threadId'],
        where: {
          threadId: { in: result.map(r => r.id) },
          senderId: { not: userId },
          readAt: null,
        },
        _count: { _all: true },
      }).catch(() => [] as any[]);
      for (const g of groups as any[]) {
        unreadByThread.set(g.threadId, g._count?._all ?? 0);
      }
    }
    for (const r of result) r.unreadCount = unreadByThread.get(r.id) ?? 0;

    // Final display order: latest activity first.
    result.sort((a, b) => {
      const aDate = a.lastMessage?.createdAt ?? a.createdAt;
      const bDate = b.lastMessage?.createdAt ?? b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('[chat] GET Error:', err);
    return NextResponse.json({ error: 'Failed to load threads' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    // `kind` is deliberately NOT read from the body: offer/system cards are
    // written server-side by /api/quotes and the Stripe webhook only, so a
    // client can never forge an offer through the chat endpoint. Everything
    // posted here is kind='text' (the column default).
    const { threadId, content, imageUrl } = body;

    if (!threadId || !content?.trim()) {
      return NextResponse.json({ error: 'threadId and content required' }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    // Authorization: only thread participants (or admin) may post into a
    // thread. Mirrors the GET check — without this any logged-in user could
    // write into any conversation by guessing/replaying a threadId.
    const thread = await prisma.chatThread.findUnique({
      where: { id: threadId },
      select: { participants: { select: { id: true } } },
    }).catch(() => null);

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    let authorized = role === 'ADMIN' || thread.participants.some(p => p.id === userId);
    if (!authorized) {
      try {
        const scalar: any = await prisma.chatThread.findUnique({
          where: { id: threadId },
          select: { customerId: true, providerId: true } as any,
        });
        if (scalar && (scalar.customerId === userId || scalar.providerId === userId)) {
          authorized = true;
        }
      } catch {
        // customerId/providerId columns missing on this DB — participants
        // was the only source of truth and already rejected this caller.
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Chat gate: messaging only opens once a booking between the two
    // participants is confirmed (deposit paid). This replaces the old
    // per-thread isLocked flag — the flag could be stale for reused
    // pair-threads keyed to a different request, letting messages through
    // before payment. Admin exempt.
    if (role !== 'ADMIN') {
      const pairIds = thread.participants.map(p => p.id);
      if (pairIds.length < 2) {
        try {
          const scalar: any = await prisma.chatThread.findUnique({
            where: { id: threadId },
            select: { customerId: true, providerId: true } as any,
          });
          for (const pid of [scalar?.customerId, scalar?.providerId]) {
            if (pid && !pairIds.includes(pid)) pairIds.push(pid);
          }
        } catch { /* scalar columns missing on this DB */ }
      }
      const confirmed = await hasConfirmedBookingBetween(pairIds);
      if (!confirmed) {
        return NextResponse.json(
          { error: 'Messaging unlocks once your booking is confirmed (deposit paid).', locked: true },
          { status: 403 },
        );
      }
    }

    const safeImageUrl =
      typeof imageUrl === 'string' && /^https?:\/\//.test(imageUrl) ? imageUrl : null;

    // imageUrl column may not exist until migration 20260701* runs — retry
    // without it so text content still goes through.
    const message = await prisma.chatMessage.create({
      data: {
        threadId,
        senderId: userId,
        content: redactPII(content.trim()),
        imageUrl: safeImageUrl,
      },
      select: { id: true, threadId: true, senderId: true, content: true, imageUrl: true, createdAt: true },
    }).catch(async (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('imageUrl') || msg.includes('column') || msg.includes('P2022')) {
        console.warn('[chat POST] imageUrl column missing, creating message without it');
        return prisma.chatMessage.create({
          data: { threadId, senderId: userId, content: redactPII(content.trim()) },
          select: { id: true, threadId: true, senderId: true, content: true, createdAt: true },
        });
      }
      throw err;
    });

    // kind/payload echoed for shape parity with GET (the row itself relies on
    // the column default, so this also holds on a pre-20260710 DB).
    return NextResponse.json({ ...message, kind: 'text', payload: null });
  } catch (err) {
    console.error('[chat] POST Error:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
