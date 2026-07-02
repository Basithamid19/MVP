import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redactPII } from '@/lib/pii-filter';
import { hasConfirmedBookingBetween, CONFIRMED_PAYMENT_STATUSES, ACTIVE_BOOKING_STATUSES } from '@/lib/chat-access';

export const dynamic = 'force-dynamic';

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
          participants: { select: { id: true } },
        },
      }).catch(() => null);

      if (!thread) {
        return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
      }

      let authorized = role === 'ADMIN' || thread.participants.some(p => p.id === userId);

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

      // Chat gate: conversations only open once a booking between the two
      // participants is confirmed (deposit paid). Admin exempt.
      if (role !== 'ADMIN') {
        const pairIds = thread.participants.map(p => p.id);
        // Legacy threads may lack the participants relation — fall back to
        // the scalar customerId/providerId columns for the pair.
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
            { error: 'Messaging unlocks once your booking is confirmed.', locked: true },
            { status: 403 },
          );
        }
      }

      // Explicit select: imageUrl (migration 20260701*) may not exist in the
      // DB yet — fall back to a select without it rather than failing the poll.
      const messages = await prisma.chatMessage.findMany({
        where: { threadId },
        select: { id: true, threadId: true, senderId: true, content: true, imageUrl: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }).catch(async (err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('imageUrl') || msg.includes('column') || msg.includes('P2022')) {
          return prisma.chatMessage.findMany({
            where: { threadId },
            select: { id: true, threadId: true, senderId: true, content: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
          });
        }
        throw err;
      });
      return NextResponse.json(messages);
    }

    // Otherwise, return all threads for the current user

    // Safe select: never references customerId/providerId/isLocked which may not
    // exist in the DB if migration 20260403000000_add_chat_thread_dedup hasn't run.
    const SAFE_THREAD_SELECT = {
      id: true,
      requestId: true,
      createdAt: true,
      participants: {
        select: { id: true, name: true, image: true, role: true },
      },
      // Explicit column list: an implicit SELECT * here would break on DBs
      // that haven't run the 20260701* imageUrl migration yet. The preview
      // only needs sender/content/timestamp anyway.
      messages: {
        select: { id: true, senderId: true, content: true, createdAt: true },
        orderBy: { createdAt: 'desc' as const },
        take: 1,
      },
      request: {
        select: {
          category: { select: { name: true } },
        },
      },
    } as const;

    // Primary query: tries customerId/providerId scalar WHERE clauses.
    // Falls back to participants-only select if the migration hasn't run yet.
    const threads: any[] = await prisma.chatThread.findMany({
      where: {
        OR: [
          { customerId: userId },
          { providerId: userId },
          { participants: { some: { id: userId } } },
        ],
      },
      select: SAFE_THREAD_SELECT,
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
          select: SAFE_THREAD_SELECT,
          orderBy: { createdAt: 'desc' },
        });
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

    // Chat gate: the inbox only surfaces conversations with counterparts the
    // caller has a CONFIRMED booking with (deposit paid / job in progress or
    // completed). Everything else stays hidden until the booking is paid.
    // Admin sees all.
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

    // Collapse duplicates: legacy data holds several threads per
    // customer↔provider pair (one per request). Surface one conversation per
    // counterpart — the ranked-best thread — so the inbox never shows the
    // same person twice.
    const seen = new Set<string>();
    const result: any[] = [];
    for (const t of ranked) {
      const otherP = t.participants.find((p: any) => p.id !== userId) ?? t.participants[0] ?? null;
      if (!otherP || seen.has(otherP.id)) continue;
      if (confirmedPartnerIds && !confirmedPartnerIds.has(otherP.id)) continue;
      seen.add(otherP.id);
      result.push({
        id: t.id,
        otherParticipant: otherP,
        lastMessage: t.messages[0] ?? null,
        category: t.request?.category?.name ?? 'Service',
        createdAt: t.createdAt,
      });
    }

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

    return NextResponse.json(message);
  } catch (err) {
    console.error('[chat] POST Error:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
