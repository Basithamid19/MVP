import prisma from '@/lib/prisma';

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
// A thread's live negotiation is the latest PENDING quote for that thread's
// request from that thread's provider. Exposed as a batch lookup so the inbox
// list can resolve every surfaced thread in one query instead of N.
// currentPrice/turn are new columns: on a DB that hasn't run the migration the
// select falls back to one without them (=> effectivePrice = price, turn =
// 'customer'), and any other failure degrades to "no negotiation" rather than
// breaking the caller.
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
};

export async function negotiationQuotes(requestIds: string[]): Promise<NegotiationQuote[]> {
  const ids = Array.from(new Set(requestIds.filter(Boolean)));
  if (!ids.length) return [];

  const BASE = {
    id: true, requestId: true, price: true, status: true, expiresAt: true,
    provider: { select: { userId: true } },
  } as const;

  const rows: any[] = await prisma.quote.findMany({
    where: { requestId: { in: ids }, status: 'PENDING' },
    select: { ...BASE, currentPrice: true, turn: true },
    orderBy: { createdAt: 'desc' },
  }).catch(async (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes('currentPrice') || msg.includes('.turn') ||
      msg.includes('column') || msg.includes('P2022') || msg.includes('expiresAt')
    ) {
      // Pre-migration DB: no negotiation state, so every pending quote reads
      // as the provider's original ask awaiting the customer.
      return prisma.quote.findMany({
        where: { requestId: { in: ids }, status: 'PENDING' },
        select: { id: true, requestId: true, price: true, status: true, provider: { select: { userId: true } } },
        orderBy: { createdAt: 'desc' },
      }).catch(() => [] as any[]);
    }
    console.error('[chat-access] negotiationQuotes failed:', err);
    return [] as any[];
  });

  return rows.map((q: any) => ({
    quoteId: q.id,
    requestId: q.requestId,
    price: q.price,
    currentPrice: q.currentPrice ?? null,
    effectivePrice: q.currentPrice ?? q.price,
    turn: (q.turn === 'provider' ? 'provider' : 'customer') as 'customer' | 'provider',
    status: q.status,
    expiresAt: q.expiresAt ?? null,
    providerUserId: q.provider?.userId ?? null,
  }));
}

// Single-thread convenience wrapper: the live negotiation between one
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
