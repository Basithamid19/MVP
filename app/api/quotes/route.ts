import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
import { checkAvailability } from '@/lib/availability';
import { buildVilniusScheduledAt } from '@/lib/time';
import { DEPOSIT_RATE, PLATFORM_FEE_RATE } from '@/lib/fees';
import { redactPII } from '@/lib/pii-filter';
import { isColumnError } from '@/lib/prisma-errors';
import {
  ensureThreadForRequest,
  findThreadForRequest as findThreadId,
  providerThreadsByRequest,
  writeStructuredMessage,
} from '@/lib/chat-access';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// In-inbox negotiation (20260710). The whole quote → counter → accept/decline
// dance is persisted as ChatMessages so both sides see identical history in
// /messages. Two invariants:
//   • Quote row = current state (currentPrice ?? price, turn ?? 'customer').
//   • ChatMessage kind='offer'/'system' = history. Written SERVER-SIDE here
//     only; POST /api/chat always forces kind='text'.
// Message writes are strictly best-effort: a failure (including a DB that
// hasn't run the migration) must never break the money/booking flow, so every
// write is .catch()-swallowed and the negotiation still works via the Quote row.
// ---------------------------------------------------------------------------

type OfferAction = 'offer' | 'counter' | 'accept' | 'decline';
type Side = 'customer' | 'provider';

function looksLikeMissingColumn(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    isColumnError(err) ||
    msg.includes('column') ||
    msg.includes('timeOfDay') ||
    msg.includes('expiresAt')
  );
}

// Thread resolution/creation lives in lib/chat-access.ts now — a direct
// service request opens the same conversation before any quote exists, so both
// entry points have to agree on the (request, customer, provider) key.
// `findThreadId` is the local alias for findThreadForRequest.

// Plain-text spellings used when kind/payload aren't deployed and the card has
// to degrade to a bubble. English only, like the rest of the server-side copy.
const OFFER_PLAIN: Record<OfferAction, string> = {
  offer:   'Offer',
  counter: 'Counter-offer',
  accept:  'Offer accepted',
  decline: 'Offer declined',
};

const SYSTEM_PLAIN: Record<string, string> = {
  booking_created:     'Booking created',
  deposit_paid:        'Deposit paid — messaging unlocked',
  quote_auto_declined: 'Quote declined — another pro was booked',
};

// Write the offer card for one negotiation action. `content` carries a short
// human-readable fallback so pre-W2 clients (which render content as text)
// still show something meaningful; a DB without kind/payload degrades to a
// plain bubble rather than losing the event (see writeStructuredMessage).
async function writeOfferMessage(
  threadId: string | null | undefined,
  senderUserId: string,
  action: OfferAction,
  quote: { id: string; price: number; estimatedHours?: number | null; expiresAt?: Date | string | null },
  opts: { note?: string | null; by: Side },
): Promise<void> {
  const note = opts.note ? redactPII(String(opts.note)).trim() : '';
  await writeStructuredMessage(
    threadId,
    senderUserId,
    'offer',
    {
      action,
      quoteId: quote.id,
      price: quote.price,
      estimatedHours: quote.estimatedHours ?? null,
      expiresAt: quote.expiresAt ? new Date(quote.expiresAt).toISOString() : null,
      note: note || null,
      by: opts.by,
    },
    {
      structured: `[${action}] €${Math.round(quote.price)}`,
      plain: `${OFFER_PLAIN[action]} — €${Math.round(quote.price)}${note ? `: ${note}` : ''}`,
    },
  );
}

// Quiet centred chip in the thread: 'booking_created', 'quote_auto_declined',
// (webhook writes 'deposit_paid').
async function writeSystemMessage(
  threadId: string | null | undefined,
  senderUserId: string,
  event: string,
  extra: Record<string, unknown> = {},
): Promise<void> {
  await writeStructuredMessage(
    threadId,
    senderUserId,
    'system',
    { event, ...extra },
    {
      structured: `[system] ${event}`,
      plain: SYSTEM_PLAIN[event] ?? `Update: ${event}`,
    },
  );
}

// GET — the caller's own sent quotes (provider only). Closes the "quote
// disappears into a black hole" gap: after sending, the lead leaves the
// inbox and there was no surface listing quote status anywhere.
//
// Each row also carries `threadId: string | null` — the conversation this quote
// is being negotiated in, so /provider/quotes can link straight into /messages.
export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'PROVIDER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const providerUserId = (session.user as any).id;
  const provider = await prisma.providerProfile.findUnique({
    where: { userId: providerUserId },
    select: { id: true },
  });
  if (!provider) return NextResponse.json([]);

  // Explicit select; expiresAt (20260707) guarded by a fallback without it.
  const QUOTE_LIST_SELECT = {
    id: true, price: true, estimatedHours: true, notes: true,
    status: true, createdAt: true, expiresAt: true,
    booking: { select: { id: true } },
    request: {
      select: {
        id: true, description: true, address: true, dateWindow: true, status: true,
        category: { select: { name: true } },
      },
    },
  } as const;

  const QUOTE_LIST_SELECT_SAFE = {
    id: true, price: true, estimatedHours: true, notes: true,
    status: true, createdAt: true,
    booking: { select: { id: true } },
    request: {
      select: {
        id: true, description: true, address: true, dateWindow: true, status: true,
        category: { select: { name: true } },
      },
    },
  } as const;

  const quotes = await prisma.quote.findMany({
    where: { providerId: provider.id },
    select: QUOTE_LIST_SELECT,
    orderBy: { createdAt: 'desc' },
    take: 100,
  }).catch(async (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('expiresAt') || msg.includes('column') || msg.includes('P2022')) {
      return prisma.quote.findMany({
        where: { providerId: provider.id },
        select: QUOTE_LIST_SELECT_SAFE,
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    }
    throw err;
  });

  // One batched thread lookup for the whole page of quotes (never N+1); the
  // helper degrades to an empty map on an un-migrated DB, which just means no
  // 'Open conversation' affordance rather than a failed list.
  const threadByRequest = await providerThreadsByRequest(
    quotes.map((q: any) => q.request?.id),
    providerUserId,
  );

  return NextResponse.json(
    quotes.map((q: any) => ({
      ...q,
      threadId: q.request?.id ? threadByRequest.get(q.request.id) ?? null : null,
    })),
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || !session.user || (session.user as any).role !== 'PROVIDER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { requestId, price, estimatedHours, notes, expiresInDays } = body;

  const parsedPrice = parseFloat(price);
  if (!requestId || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
    return NextResponse.json({ error: 'A valid requestId and positive price are required' }, { status: 400 });
  }

  // Quote validity window: 1–14 days, default 3.
  const days = Math.min(14, Math.max(1, parseInt(expiresInDays, 10) || 3));
  const expiresAt = new Date(Date.now() + days * 86400000);

  const provider = await prisma.providerProfile.findUnique({
    where: { userId: (session.user as any).id },
    include: { categories: { select: { id: true } } },
  });

  if (!provider) {
    return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 });
  }

  // targetProviderId is a new column (20260706) — fall back to a select
  // without it on un-migrated DBs.
  const serviceRequest: any = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    select: { categoryId: true, customerId: true, status: true, targetProviderId: true },
  }).catch(async (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('targetProviderId') || msg.includes('column') || msg.includes('P2022')) {
      return prisma.serviceRequest.findUnique({
        where: { id: requestId },
        select: { categoryId: true, customerId: true, status: true },
      });
    }
    throw err;
  });

  if (!serviceRequest) {
    return NextResponse.json({ error: 'Service request not found' }, { status: 404 });
  }

  // Direct requests can only be quoted by their target provider.
  if (serviceRequest.targetProviderId && serviceRequest.targetProviderId !== provider.id) {
    return NextResponse.json(
      { error: 'This request was sent directly to another provider.' },
      { status: 403 },
    );
  }

  // Only open requests can be quoted. Without this a provider could quote a
  // request that was already accepted (race with the leads list, or a direct
  // URL) — a quote that can never be actioned, after a fake success screen.
  if (!['NEW', 'QUOTED'].includes(serviceRequest.status)) {
    return NextResponse.json(
      { error: 'This request is no longer open for quotes.' },
      { status: 409 },
    );
  }

  const providerCategoryIds = provider.categories.map(c => c.id);
  if (!providerCategoryIds.includes(serviceRequest.categoryId)) {
    return NextResponse.json(
      { error: 'You can only quote on requests that match your service categories' },
      { status: 403 },
    );
  }

  // One quote per provider per request.
  const existingQuote = await prisma.quote.findFirst({
    where: { requestId, providerId: provider.id },
    select: { id: true },
  });
  if (existingQuote) {
    return NextResponse.json(
      { error: 'You have already sent a quote for this request.' },
      { status: 409 },
    );
  }

  // expiresAt is a new column (20260707) — fall back to a create without it.
  // Explicit select on purpose: an implicit "return every scalar" would also
  // ask for the 20260710 currentPrice/turn columns and blow up on a DB that
  // hasn't run that migration. `turn` starts null, which reads as 'customer'.
  const QUOTE_CREATE_SELECT = {
    id: true, requestId: true, providerId: true, price: true,
    estimatedHours: true, notes: true, status: true, expiresAt: true, createdAt: true,
  } as const;

  const quote: any = await prisma.quote.create({
    data: {
      requestId,
      providerId: provider.id,
      price: parsedPrice,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
      notes,
      status: 'PENDING',
      expiresAt,
      turn: 'customer',
    },
    select: QUOTE_CREATE_SELECT,
  }).catch(async (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('turn') || msg.includes('column') || msg.includes('P2022')) {
      console.warn('[quotes POST] turn column missing, creating without it');
      return prisma.quote.create({
        data: {
          requestId,
          providerId: provider.id,
          price: parsedPrice,
          estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
          notes,
          status: 'PENDING',
          expiresAt,
        },
        select: QUOTE_CREATE_SELECT,
      }).catch(async (err2: unknown) => {
        const msg2 = err2 instanceof Error ? err2.message : String(err2);
        if (msg2.includes('expiresAt') || msg2.includes('column') || msg2.includes('P2022')) {
          console.warn('[quotes POST] expiresAt column missing, creating without it');
          return prisma.quote.create({
            data: {
              requestId,
              providerId: provider.id,
              price: parsedPrice,
              estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
              notes,
              status: 'PENDING',
            },
            select: {
              id: true, requestId: true, providerId: true, price: true,
              estimatedHours: true, notes: true, status: true, createdAt: true,
            },
          });
        }
        throw err2;
      });
    }
    throw err;
  });

  await prisma.serviceRequest.update({
    where: { id: requestId },
    data: { status: 'QUOTED' },
  });

  const providerUserId = (session.user as any).id;
  const customerProfile = await prisma.customerProfile.findUnique({
    where: { id: serviceRequest.customerId },
    select: { userId: true },
  });

  // Find-or-create the chat thread between provider and customer. A DIRECT
  // request already opened it at request time (see /api/requests POST), so this
  // usually just resolves the existing row. Runs BEFORE the notification: the
  // quote lives in the conversation, so the notification deep-links to it.
  const threadId: string | null = customerProfile
    ? await ensureThreadForRequest(requestId, customerProfile.userId, providerUserId)
    : null;

  // The offer card — first message of the negotiation. Best-effort.
  await writeOfferMessage(
    threadId,
    providerUserId,
    'offer',
    { id: quote.id, price: parsedPrice, estimatedHours: quote.estimatedHours ?? null, expiresAt: quote.expiresAt ?? expiresAt },
    { by: 'provider', note: notes ?? null },
  );

  // Notify customer about new quote
  if (customerProfile) {
    const providerUser = await prisma.user.findUnique({ where: { id: providerUserId }, select: { name: true } });
    createNotification({
      userId: customerProfile.userId,
      type: 'quote',
      title: 'New quote received',
      body: `${providerUser?.name ?? 'A pro'} sent you a quote for €${parsedPrice.toFixed(0)}`,
      href: threadId ? `/messages?thread=${threadId}` : `/requests/${requestId}`,
    });
  }

  return NextResponse.json({ ...quote, threadId });
}

// PATCH — one endpoint for every negotiation action.
//
// Body: { quoteId, action: 'accept' | 'decline' | 'counter', price?, note? }
// Backward compatible: the live UI still sends { quoteId, status: 'ACCEPTED' |
// 'DECLINED' }, which maps onto accept/decline. Response is unchanged for
// those callers (quote fields + bookingId on accept), plus threadId.
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { quoteId, status, price, note } = body;
  const rawAction = typeof body.action === 'string' ? body.action.toLowerCase() : null;

  // Legacy shape { status: 'ACCEPTED' | 'DECLINED' } → action.
  const action: OfferAction | null =
    rawAction === 'accept' || rawAction === 'decline' || rawAction === 'counter'
      ? rawAction
      : status === 'ACCEPTED' ? 'accept'
      : status === 'DECLINED' ? 'decline'
      : null;

  if (!quoteId || !action) {
    return NextResponse.json({ error: 'quoteId and a valid action are required' }, { status: 400 });
  }

  // Counter price validation up front — cheap rejection before any DB work.
  let counterPrice = 0;
  if (action === 'counter') {
    counterPrice = parseFloat(price);
    if (!Number.isFinite(counterPrice) || counterPrice <= 0 || counterPrice > 100000) {
      return NextResponse.json({ error: 'A valid counter price is required' }, { status: 400 });
    }
  }

  // Explicit select (not include) so we can guard the new ServiceRequest
  // .timeOfDay column and the 20260710 currentPrice/turn columns with P2022
  // fallbacks per the migration-safety pattern. Three rungs: full → without
  // negotiation columns → without negotiation columns or timeOfDay/expiresAt.
  const QUOTE_SELECT = {
    id: true, price: true, currentPrice: true, turn: true, estimatedHours: true,
    providerId: true, requestId: true, status: true, expiresAt: true,
    provider: { select: { userId: true } },
    request: {
      select: {
        id: true, customerId: true, status: true, dateWindow: true, timeOfDay: true,
        customer: { select: { userId: true } },
      },
    },
  } as const;
  const QUOTE_SELECT_NO_NEG = {
    id: true, price: true, estimatedHours: true,
    providerId: true, requestId: true, status: true, expiresAt: true,
    provider: { select: { userId: true } },
    request: {
      select: {
        id: true, customerId: true, status: true, dateWindow: true, timeOfDay: true,
        customer: { select: { userId: true } },
      },
    },
  } as const;
  const QUOTE_SELECT_MINIMAL = {
    id: true, price: true, estimatedHours: true,
    providerId: true, requestId: true, status: true,
    provider: { select: { userId: true } },
    request: {
      select: {
        id: true, customerId: true, status: true, dateWindow: true,
        customer: { select: { userId: true } },
      },
    },
  } as const;

  const quote: any = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: QUOTE_SELECT,
  }).catch(async (err: unknown) => {
    if (!looksLikeMissingColumn(err)) throw err;
    return prisma.quote.findUnique({ where: { id: quoteId }, select: QUOTE_SELECT_NO_NEG })
      .catch(async (err2: unknown) => {
        if (!looksLikeMissingColumn(err2)) throw err2;
        return prisma.quote.findUnique({ where: { id: quoteId }, select: QUOTE_SELECT_MINIMAL });
      });
  });

  if (!quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
  }

  const callerId = (session.user as any).id;
  const callerRole = (session.user as any).role;
  const customerUserId: string | null = quote.request.customer?.userId ?? null;
  const providerUserId: string | null = quote.provider?.userId ?? null;
  const currentTurn: Side = quote.turn === 'provider' ? 'provider' : 'customer';
  const effectivePrice: number = quote.currentPrice ?? quote.price;

  // Authorization: both sides of the negotiation may act now (the provider
  // can counter or accept the customer's counter, and either side may
  // decline). Admin acts as whichever side currently holds the turn, for
  // moderation/repair flows.
  let callerSide: Side | null = null;
  if (customerUserId && callerId === customerUserId) callerSide = 'customer';
  else if (providerUserId && callerId === providerUserId) callerSide = 'provider';
  else if (callerRole === 'ADMIN') callerSide = currentTurn;

  if (!callerSide) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const otherSide: Side = callerSide === 'customer' ? 'provider' : 'customer';

  // Only a PENDING quote can be actioned. Re-sending ACCEPTED for an already
  // accepted quote used to create a duplicate Booking + Payment on every call.
  if (quote.status !== 'PENDING') {
    return NextResponse.json({ error: `Quote already ${quote.status.toLowerCase()}` }, { status: 409 });
  }

  // Turn discipline: accept/counter belong to the side the ball is with.
  // Decline is always available to either participant (a provider decline is
  // a withdrawal).
  if ((action === 'accept' || action === 'counter') && callerSide !== currentTurn) {
    return NextResponse.json(
      { error: "It's the other side's turn on this offer. Refresh to see the latest." },
      { status: 409 },
    );
  }

  const threadId = await findThreadId(quote.requestId, customerUserId, providerUserId);
  const counterpartUserId = callerSide === 'customer' ? providerUserId : customerUserId;
  const counterpartHref = threadId
    ? `/messages?thread=${threadId}`
    : otherSide === 'customer' ? `/requests/${quote.requestId}` : '/provider/quotes';
  const callerName: string | null = await prisma.user
    .findUnique({ where: { id: callerId }, select: { name: true } })
    .then(u => u?.name ?? null)
    .catch(() => null);

  // -------------------------------------------------------------------------
  // COUNTER — no booking, no money: just move the price and flip the turn.
  // -------------------------------------------------------------------------
  if (action === 'counter') {
    const updated: any = await prisma.quote.update({
      where: { id: quoteId },
      data: { currentPrice: counterPrice, turn: otherSide },
      select: { id: true, status: true, price: true, currentPrice: true, turn: true, requestId: true, providerId: true },
    }).catch((err: unknown) => {
      if (looksLikeMissingColumn(err)) {
        console.warn('[quotes PATCH] currentPrice/turn columns missing — counter unavailable');
        return null;
      }
      throw err;
    });

    if (!updated) {
      return NextResponse.json(
        { error: 'Counter-offers are not available yet. Accept or decline this quote instead.' },
        { status: 409 },
      );
    }

    await writeOfferMessage(
      threadId,
      callerId,
      'counter',
      { id: quote.id, price: counterPrice, estimatedHours: quote.estimatedHours ?? null, expiresAt: quote.expiresAt ?? null },
      { by: callerSide, note: note ?? null },
    );

    if (counterpartUserId) {
      createNotification({
        userId: counterpartUserId,
        type: 'quote',
        title: 'Counter-offer received',
        body: `${callerName ?? (callerSide === 'customer' ? 'The customer' : 'The pro')} countered with €${counterPrice.toFixed(0)}.`,
        href: counterpartHref,
      });
    }

    return NextResponse.json({ ...updated, threadId });
  }

  // -------------------------------------------------------------------------
  // ACCEPT / DECLINE
  // -------------------------------------------------------------------------
  const nextStatus = action === 'accept' ? 'ACCEPTED' : 'DECLINED';

  // Expired quotes can't be accepted (the provider set a validity window).
  // Only enforced for a customer accept: expiresAt bounds the PROVIDER's offer.
  // A provider accepting the customer's counter is accepting fresh terms the
  // customer just put on the table, which the old window shouldn't kill.
  if (action === 'accept' && callerSide === 'customer' && quote.expiresAt && new Date(quote.expiresAt) < new Date()) {
    return NextResponse.json(
      { error: 'This quote has expired. Ask the pro for a new quote or pick another one.' },
      { status: 409 },
    );
  }

  // Request-level double-booking guard: a request yields at most one booking.
  // Without this, a customer could accept a second (still-PENDING) quote on a
  // request that already has an accepted quote/booking → duplicate Booking +
  // Payment + deposit demand for the same job.
  if (action === 'accept') {
    if (quote.request.status === 'ACCEPTED') {
      return NextResponse.json({ error: 'This request already has an accepted quote.' }, { status: 409 });
    }
    const alreadyAccepted = await prisma.quote.findFirst({
      where: { requestId: quote.requestId, status: 'ACCEPTED' },
      select: { id: true },
    });
    const existingBooking = await prisma.booking.findFirst({
      where: { quote: { requestId: quote.requestId } },
      select: { id: true },
    });
    if (alreadyAccepted || existingBooking) {
      return NextResponse.json({ error: 'This request already has a booking.' }, { status: 409 });
    }
  }

  // Compute the booking instant in Vilnius local time (date + time-of-day),
  // used both for the availability check and the stored scheduledAt.
  // ACCEPTED-only — declines never need it.
  const scheduledAt = action === 'accept'
    ? buildVilniusScheduledAt(quote.request.dateWindow, quote.request.timeOfDay ?? null)
    : quote.request.dateWindow;

  // Enforce provider availability (blackout dates / working hours / buffer)
  // before committing. Degrades to allow on un-migrated DBs.
  if (action === 'accept') {
    const avail = await checkAvailability(quote.providerId, scheduledAt);
    // `=== false` (not `!avail.ok`): with strict:false the truthiness check
    // doesn't narrow the discriminated union and tsc rejects .reason/.code.
    if (avail.ok === false) {
      return NextResponse.json({ error: avail.reason, errorCode: avail.code }, { status: 409 });
    }
  }

  // Explicit select: an implicit full-row return would ask for currentPrice/
  // turn and fail on a DB that hasn't run 20260710.
  const updatedQuote: any = await prisma.quote.update({
    where: { id: quoteId },
    data: { status: nextStatus },
    select: { id: true, status: true, price: true, currentPrice: true, turn: true, requestId: true, providerId: true },
  }).catch(async (err: unknown) => {
    if (!looksLikeMissingColumn(err)) throw err;
    return prisma.quote.update({
      where: { id: quoteId },
      data: { status: nextStatus },
      select: { id: true, status: true, price: true, requestId: true, providerId: true },
    });
  });

  if (action === 'decline') {
    await writeOfferMessage(
      threadId,
      callerId,
      'decline',
      { id: quote.id, price: effectivePrice, estimatedHours: quote.estimatedHours ?? null, expiresAt: quote.expiresAt ?? null },
      { by: callerSide, note: note ?? null },
    );

    // A manual decline used to notify nobody: the counterpart's quote simply
    // flipped to DECLINED with no signal anywhere.
    if (counterpartUserId) {
      createNotification({
        userId: counterpartUserId,
        type: 'quote',
        title: 'Offer declined',
        body: callerSide === 'customer'
          ? `${callerName ?? 'The customer'} declined the €${effectivePrice.toFixed(0)} offer.`
          : `${callerName ?? 'The pro'} withdrew their €${effectivePrice.toFixed(0)} offer.`,
        href: counterpartHref,
      });
    }

    return NextResponse.json({ ...updatedQuote, threadId });
  }

  // ---- accept: request → ACCEPTED, siblings auto-declined, Booking+Payment --
  await prisma.serviceRequest.update({
    where: { id: quote.requestId },
    data: { status: 'ACCEPTED' },
  });

  // Auto-decline the other still-PENDING quotes on this request so the
  // customer's inbox reflects that the job is now committed — and tell the
  // losing providers, who previously saw their quote flip to declined with
  // no signal at all.
  const siblingQuotes = await prisma.quote.findMany({
    where: { requestId: quote.requestId, status: 'PENDING', id: { not: quote.id } },
    select: { id: true, provider: { select: { userId: true } } },
  }).catch(() => [] as { id: string; provider: { userId: string } | null }[]);

  await prisma.quote.updateMany({
    where: { requestId: quote.requestId, status: 'PENDING', id: { not: quote.id } },
    data: { status: 'DECLINED' },
  }).catch(() => {});

  for (const sibling of siblingQuotes) {
    if (sibling.provider?.userId) {
      createNotification({
        userId: sibling.provider.userId,
        type: 'status',
        title: 'Quote not selected',
        body: 'The customer chose another quote for this job. More leads are waiting for you.',
        href: '/provider/leads',
      });
      // ...and reflect it in the losing thread, which otherwise still shows a
      // live-looking offer card. Best-effort, never fatal.
      const siblingThreadId = await findThreadId(quote.requestId, customerUserId, sibling.provider.userId);
      await writeSystemMessage(siblingThreadId, callerId, 'quote_auto_declined', { quoteId: sibling.id });
    }
  }

  const depositAmount = effectivePrice * DEPOSIT_RATE;

  // Try with depositAmount (new column); fall back to without if migration not applied
  const booking = await prisma.booking.create({
    data: {
      customerId: quote.request.customerId,
      providerId: quote.providerId,
      quoteId: quote.id,
      scheduledAt,
      totalAmount: effectivePrice,
      depositAmount,
      status: 'SCHEDULED',
    },
    select: { id: true, totalAmount: true },
  }).catch(async (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('depositAmount') || msg.includes('column') || msg.includes('P2022')) {
      console.warn('[quotes PATCH] depositAmount column missing, creating booking without it');
      return prisma.booking.create({
        data: {
          customerId: quote.request.customerId,
          providerId: quote.providerId,
          quoteId: quote.id,
          scheduledAt,
          totalAmount: effectivePrice,
          status: 'SCHEDULED',
        },
        select: { id: true, totalAmount: true },
      });
    }
    throw err;
  });

  // Create pending payment record — customer must pay deposit to confirm
  // Non-fatal if new payment columns (depositAmount, platformFee) don't exist yet
  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      amount: effectivePrice,
      depositAmount,
      platformFee: effectivePrice * PLATFORM_FEE_RATE,
      status: 'PENDING',
    },
    select: { id: true },
  }).catch(async (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('depositAmount') || msg.includes('platformFee') || msg.includes('column') || msg.includes('P2022')) {
      console.warn('[quotes PATCH] new payment columns missing, creating payment without them');
      await prisma.payment.create({
        data: { bookingId: booking.id, amount: effectivePrice, status: 'PENDING' },
        select: { id: true },
      }).catch(() => {});
    }
  });

  // Lock the chat thread until deposit is paid
  await prisma.chatThread.updateMany({
    where: { requestId: quote.requestId },
    data: { isLocked: true },
  }).catch(() => {}); // non-fatal if isLocked column not yet in DB

  // Persist the accepted terms + the booking hand-off in the conversation.
  await writeOfferMessage(
    threadId,
    callerId,
    'accept',
    { id: quote.id, price: effectivePrice, estimatedHours: quote.estimatedHours ?? null, expiresAt: quote.expiresAt ?? null },
    { by: callerSide },
  );
  await writeSystemMessage(threadId, callerId, 'booking_created', { bookingId: booking.id });

  // Notify provider that their quote was accepted. Fires regardless of which
  // side clicked accept — when the provider accepts a customer counter this is
  // their own confirmation of the agreed figure.
  const providerProfile = await prisma.providerProfile.findUnique({
    where: { id: quote.providerId },
    select: { userId: true },
  });
  if (providerProfile) {
    const customerUser = await prisma.user.findFirst({
      where: { customerProfile: { id: quote.request.customerId } },
      select: { name: true },
    });
    createNotification({
      userId: providerProfile.userId,
      type: 'booking',
      title: callerSide === 'provider' ? 'Deal agreed!' : 'Quote accepted!',
      body: callerSide === 'provider'
        ? `You accepted ${customerUser?.name ?? 'the customer'}'s €${effectivePrice.toFixed(0)} offer. Waiting for deposit.`
        : `${customerUser?.name ?? 'A customer'} accepted your quote for €${effectivePrice.toFixed(0)}. Waiting for deposit.`,
      href: `/provider/jobs/${booking.id}`,
    });
  }

  // Notify customer to pay deposit — also unconditional, so a provider-side
  // accept still tells the customer that money is now due.
  const acceptCustomerProfile = await prisma.customerProfile.findUnique({
    where: { id: quote.request.customerId },
    select: { userId: true },
  });
  if (acceptCustomerProfile) {
    createNotification({
      userId: acceptCustomerProfile.userId,
      type: 'payment',
      title: 'Pay deposit to confirm booking',
      body: `Pay the €${depositAmount.toFixed(2)} deposit (20%) to confirm your booking.`,
      href: `/bookings/${booking.id}`,
    });
  }

  return NextResponse.json({ ...updatedQuote, bookingId: booking.id, threadId });
}
