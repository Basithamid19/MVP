import prisma from '@/lib/prisma';
import { isColumnError } from '@/lib/prisma-errors';

// Chat access policy: a customer and provider may only message each other once
// a booking between them is CONFIRMED — deposit held (or later: paid /
// processing / job in progress / completed). Before that, no chat anywhere on
// the platform. Server-only (imports Prisma).

export const CONFIRMED_PAYMENT_STATUSES = ['DEPOSIT_HELD', 'PAID', 'PROCESSING'];
export const ACTIVE_BOOKING_STATUSES = ['IN_PROGRESS', 'COMPLETED'];

// True when the two users (order-independent; one is the customer, one the
// provider) share at least one non-canceled booking whose deposit has been
// paid — or that has already progressed/completed (which implies payment in
// the normal flow and covers legacy rows without a payment record).
export async function hasConfirmedBookingBetween(userIds: string[]): Promise<boolean> {
  const ids = userIds.filter(Boolean);
  if (ids.length < 2) return false;

  const booking = await prisma.booking.findFirst({
    where: {
      status: { not: 'CANCELED' },
      customer: { userId: { in: ids } },
      provider: { userId: { in: ids } },
      OR: [
        { payment: { status: { in: CONFIRMED_PAYMENT_STATUSES } } },
        { status: { in: ACTIVE_BOOKING_STATUSES as any } },
      ],
    },
    select: { id: true },
  });

  return booking != null;
}

// ---------------------------------------------------------------------------
// Negotiation state (20260710) — the in-inbox offer/counter flow.
//
// A thread's negotiation is the LATEST quote for that thread's request from
// that thread's provider — whatever its status. It used to be PENDING-only,
// which meant the state vanished the moment the deal was settled: the inbox
// chip went blank right after an accept or a decline, and the ACCEPTED /
// DECLINED chip states were unreachable. Preference order per
// (request, provider) pair is now:
//   1. the live PENDING quote, if there is one (the ball is still in play);
//   2. otherwise the most recent quote by createdAt (Quote has no updatedAt),
//      so the thread keeps saying '€X · Accepted' / 'Declined' forever.
// Only a PENDING negotiation is actionable — OfferCard gates its action row on
// `status === 'PENDING'`, so surfacing settled quotes here adds no new buttons.
//
// Exposed as a batch lookup so the inbox list can resolve every surfaced
// thread in one query instead of N. currentPrice/turn are new columns: on a DB
// that hasn't run the migration the select falls back to one without them (=>
// effectivePrice = price, turn = 'customer'), and any other failure degrades to
// "no negotiation" rather than breaking the caller.
// ---------------------------------------------------------------------------

export type NegotiationQuote = {
  quoteId: string;
  requestId: string;
  price: number;
  currentPrice: number | null;
  effectivePrice: number;
  turn: 'customer' | 'provider';
  status: string;
  expiresAt: Date | null;
  providerUserId: string | null;
  /**
   * Enough to rebuild the offer card from state alone. The chat cards are
   * best-effort writes; when one is missing the client synthesizes a card from
   * this payload so a live negotiation is never unactionable (see the
   * `syntheticOffer` path in components/shared/chat-view.tsx).
   */
  estimatedHours: number | null;
  createdAt: Date | null;
};

export async function negotiationQuotes(requestIds: string[]): Promise<NegotiationQuote[]> {
  const ids = Array.from(new Set(requestIds.filter(Boolean)));
  if (!ids.length) return [];

  const BASE = {
    id: true, requestId: true, price: true, status: true, expiresAt: true,
    estimatedHours: true, createdAt: true,
    provider: { select: { userId: true } },
  } as const;

  const rows: any[] = await prisma.quote.findMany({
    where: { requestId: { in: ids } },
    select: { ...BASE, currentPrice: true, turn: true },
    orderBy: { createdAt: 'desc' },
  }).catch(async (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes('currentPrice') || msg.includes('.turn') ||
      msg.includes('column') || msg.includes('P2022') || msg.includes('expiresAt')
    ) {
      // Pre-migration DB: no negotiation state, so every quote reads as the
      // provider's original ask awaiting the customer.
      return prisma.quote.findMany({
        where: { requestId: { in: ids } },
        select: {
          id: true, requestId: true, price: true, status: true,
          estimatedHours: true, createdAt: true,
          provider: { select: { userId: true } },
        },
        orderBy: { createdAt: 'desc' },
      }).catch(() => [] as any[]);
    }
    console.error('[chat-access] negotiationQuotes failed:', err);
    return [] as any[];
  });

  const mapped: NegotiationQuote[] = rows.map((q: any) => ({
    quoteId: q.id,
    requestId: q.requestId,
    price: q.price,
    currentPrice: q.currentPrice ?? null,
    effectivePrice: q.currentPrice ?? q.price,
    turn: (q.turn === 'provider' ? 'provider' : 'customer') as 'customer' | 'provider',
    status: q.status,
    expiresAt: q.expiresAt ?? null,
    providerUserId: q.provider?.userId ?? null,
    estimatedHours: q.estimatedHours ?? null,
    createdAt: q.createdAt ?? null,
  }));

  // One negotiation per (request, provider) pair. Rows arrive newest-first, so
  // the first one seen for a key is the most recent; a PENDING quote always
  // wins over a settled one because that's the offer still on the table.
  const byPair = new Map<string, NegotiationQuote>();
  for (const q of mapped) {
    const key = `${q.requestId}::${q.providerUserId ?? ''}`;
    const held = byPair.get(key);
    if (!held) { byPair.set(key, q); continue; }
    if (held.status !== 'PENDING' && q.status === 'PENDING') byPair.set(key, q);
  }
  return Array.from(byPair.values());
}

// Single-thread convenience wrapper: the negotiation between one
// customer/provider pair on one request, or null.
export async function negotiationSummary(
  requestId: string | null | undefined,
  providerUserId: string | null | undefined,
): Promise<NegotiationQuote | null> {
  if (!requestId) return null;
  const rows = await negotiationQuotes([requestId]);
  if (!rows.length) return null;
  if (!providerUserId) return rows[0];
  return rows.find(r => r.providerUserId === providerUserId) ?? null;
}

// ---------------------------------------------------------------------------
// Thread resolution for quote lists (20260710 W3).
//
// The negotiation lives in /messages, so every surface that lists quotes needs
// the thread id to hand off to. Both helpers are BATCHED — one findMany, never
// one query per quote — and both fall back from the scalar customerId/
// providerId columns (migration 20260403) to the participants relation, then
// to an empty map (=> null threadIds, and the caller renders no hand-off) so a
// DB behind on migrations degrades instead of 500ing.
// ---------------------------------------------------------------------------

function isThreadColumnError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('customerId') || msg.includes('providerId') ||
    msg.includes('column') || msg.includes('P2022')
  );
}

/**
 * Resolve the thread for a (request, customer user, provider user) triple.
 * Scalar WHERE first, participants relation as the pre-20260403 fallback,
 * null on anything else — callers treat "no thread" as a soft state.
 */
export async function findThreadForRequest(
  requestId: string | null | undefined,
  customerUserId: string | null | undefined,
  providerUserId: string | null | undefined,
): Promise<string | null> {
  if (!requestId || !customerUserId || !providerUserId) return null;
  const thread = await prisma.chatThread.findFirst({
    where: { requestId, customerId: customerUserId, providerId: providerUserId },
    select: { id: true },
  }).catch(async () =>
    prisma.chatThread.findFirst({
      where: {
        requestId,
        AND: [
          { participants: { some: { id: providerUserId } } },
          { participants: { some: { id: customerUserId } } },
        ],
      },
      select: { id: true },
    }).catch(() => null)
  );
  return thread?.id ?? null;
}

/**
 * Find-or-create the conversation for one request between one customer and one
 * provider. Both ids are USER ids (ChatThread.customerId/providerId reference
 * User, not the profile rows).
 *
 * Every failure path returns null instead of throwing: this is called from the
 * request/quote creation flows, where a missing conversation is a degraded but
 * survivable outcome and an exception would lose the customer's request.
 *   • P2002 (concurrent create, or the 20260403 dedup unique index) → re-find.
 *   • Missing scalar columns → findThreadForRequest's participants fallback
 *     handles the read; the create still needs them (NOT NULL since 20260403),
 *     so a genuinely pre-20260403 DB logs and yields null.
 */
export async function ensureThreadForRequest(
  requestId: string | null | undefined,
  customerUserId: string | null | undefined,
  providerUserId: string | null | undefined,
): Promise<string | null> {
  if (!requestId || !customerUserId || !providerUserId) return null;
  // A provider acting as their own customer would create a one-person thread.
  if (customerUserId === providerUserId) return null;

  try {
    const existing = await findThreadForRequest(requestId, customerUserId, providerUserId);
    if (existing) return existing;

    const created = await prisma.chatThread.create({
      data: {
        requestId,
        customerId: customerUserId,
        providerId: providerUserId,
        participants: { connect: [{ id: customerUserId }, { id: providerUserId }] },
      },
      select: { id: true },
    }).catch(async (err: any) => {
      if (err?.code === 'P2002') {
        const id = await findThreadForRequest(requestId, customerUserId, providerUserId);
        return id ? { id } : null;
      }
      console.error('[chat-access] ensureThreadForRequest create failed:', err);
      return null;
    });

    return created?.id ?? null;
  } catch (err) {
    console.error('[chat-access] ensureThreadForRequest failed:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Structured card writes (20260711).
//
// Offer/system cards are ChatMessage rows with kind + payload. Those two
// columns arrived in 20260710, and the write used to be swallowed wholesale on
// failure — so on a DB behind that migration the negotiation history simply
// never appeared and the thread read as empty. It now DEGRADES TO TEXT: the
// same event is persisted as a plain kind-less message carrying human-readable
// content, which every client renders as a bubble. Only if that second write
// also fails do we log and drop.
//
// Still strictly best-effort in every path — these calls sit inside the
// money/booking flows and must never throw.
// ---------------------------------------------------------------------------

export async function writeStructuredMessage(
  threadId: string | null | undefined,
  senderUserId: string | null | undefined,
  kind: 'offer' | 'system',
  payload: Record<string, unknown>,
  content: { structured: string; plain: string },
): Promise<void> {
  if (!threadId || !senderUserId) return;

  try {
    await prisma.chatMessage.create({
      data: { threadId, senderId: senderUserId, content: content.structured, kind, payload: payload as any },
      select: { id: true },
    });
    return;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const missingColumn =
      isColumnError(err) || msg.includes('kind') || msg.includes('column');
    if (!missingColumn) {
      console.error(`[chat-access] ${kind} message write failed:`, err);
      return;
    }
    // kind/payload not deployed here — keep the event, lose the card.
    await prisma.chatMessage.create({
      data: { threadId, senderId: senderUserId, content: content.plain },
      select: { id: true },
    }).catch((err2: unknown) => {
      console.error(`[chat-access] ${kind} message text fallback failed:`, err2);
    });
  }
}

// ---------------------------------------------------------------------------
// Request context for a thread (20260711).
//
// Every conversation is anchored on a ServiceRequest, and a direct request now
// opens the thread BEFORE any quote exists — so the request itself is the only
// content the thread has to show. /api/chat surfaces this summary on both the
// detail response and each list row (see the contract comment in
// app/api/chat/route.ts).
//
// Batched (one findMany for every surfaced thread) and fully degrading: an
// orphaned requestId or a DB behind on migrations yields no row, and the caller
// renders `request: null`.
// ---------------------------------------------------------------------------

export type RequestSummary = {
  id: string;
  description: string | null;
  budget: number | null;
  dateWindow: Date | null;
  isUrgent: boolean;
  status: string;
  categoryName: string | null;
};

export async function requestSummaries(
  requestIds: (string | null | undefined)[],
): Promise<Map<string, RequestSummary>> {
  const out = new Map<string, RequestSummary>();
  const ids = Array.from(new Set(requestIds.filter(Boolean))) as string[];
  if (!ids.length) return out;

  const REQUEST_SELECT = {
    id: true,
    description: true,
    budget: true,
    dateWindow: true,
    isUrgent: true,
    status: true,
    category: { select: { name: true } },
  } as const;

  const rows: any[] = await prisma.serviceRequest.findMany({
    where: { id: { in: ids } },
    select: REQUEST_SELECT,
  }).catch((err: unknown) => {
    console.error('[chat-access] requestSummaries failed:', err);
    return [] as any[];
  });

  for (const r of rows) {
    if (!r?.id) continue;
    out.set(r.id, {
      id: r.id,
      description: r.description ?? null,
      budget: r.budget ?? null,
      dateWindow: r.dateWindow ?? null,
      isUrgent: !!r.isUrgent,
      status: r.status ?? '',
      categoryName: r.category?.name ?? null,
    });
  }
  return out;
}

/** Single-thread convenience wrapper around `requestSummaries`. */
export async function requestSummary(
  requestId: string | null | undefined,
): Promise<RequestSummary | null> {
  if (!requestId) return null;
  const map = await requestSummaries([requestId]);
  return map.get(requestId) ?? null;
}

/**
 * requestId → threadId for one provider's own conversations. Used by
 * GET /api/quotes (the provider's sent-quotes list).
 */
export async function providerThreadsByRequest(
  requestIds: string[],
  providerUserId: string | null | undefined,
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const ids = Array.from(new Set(requestIds.filter(Boolean)));
  if (!ids.length || !providerUserId) return out;

  const rows: any[] = await prisma.chatThread.findMany({
    where: { requestId: { in: ids }, providerId: providerUserId },
    select: { id: true, requestId: true },
  }).catch(async (err: unknown) => {
    if (!isThreadColumnError(err)) {
      console.error('[chat-access] providerThreadsByRequest failed:', err);
      return [] as any[];
    }
    return prisma.chatThread.findMany({
      where: { requestId: { in: ids }, participants: { some: { id: providerUserId } } },
      select: { id: true, requestId: true },
    }).catch(() => [] as any[]);
  });

  for (const r of rows) {
    if (r?.requestId && r?.id && !out.has(r.requestId)) out.set(r.requestId, r.id);
  }
  return out;
}

/**
 * provider userId → threadId for every conversation on ONE request. Used by
 * the customer's request detail (GET /api/requests?id=…) to give each quote row
 * its 'Open conversation' target. `customerUserId` scopes the lookup to the
 * asking customer's own threads; the participants fallback keeps that scoping.
 */
export async function requestThreadsByProvider(
  requestId: string | null | undefined,
  customerUserId: string | null | undefined,
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!requestId) return out;

  const rows: any[] = await prisma.chatThread.findMany({
    where: {
      requestId,
      ...(customerUserId ? { customerId: customerUserId } : {}),
    },
    select: { id: true, providerId: true },
  }).catch(async (err: unknown) => {
    if (!isThreadColumnError(err)) {
      console.error('[chat-access] requestThreadsByProvider failed:', err);
      return [] as any[];
    }
    // No scalar columns: derive the provider side from the participants
    // relation instead, and normalise to the same { id, providerId } shape.
    const legacy = await prisma.chatThread.findMany({
      where: {
        requestId,
        ...(customerUserId ? { participants: { some: { id: customerUserId } } } : {}),
      },
      select: { id: true, participants: { select: { id: true, role: true } } },
    }).catch(() => [] as any[]);
    return legacy.map((t: any) => ({
      id: t.id,
      providerId: t.participants?.find((p: any) => p.role === 'PROVIDER')?.id ?? null,
    }));
  });

  for (const r of rows) {
    if (r?.providerId && r?.id && !out.has(r.providerId)) out.set(r.providerId, r.id);
  }
  return out;
}
