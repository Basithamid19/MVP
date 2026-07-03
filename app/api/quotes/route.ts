import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
import { checkAvailability } from '@/lib/availability';
import { buildVilniusScheduledAt } from '@/lib/time';
import { DEPOSIT_RATE, PLATFORM_FEE_RATE } from '@/lib/fees';

export const dynamic = 'force-dynamic';

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
  const quote = await prisma.quote.create({
    data: {
      requestId,
      providerId: provider.id,
      price: parsedPrice,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
      notes,
      status: 'PENDING',
      expiresAt,
    },
  }).catch(async (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('expiresAt') || msg.includes('column') || msg.includes('P2022')) {
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
      });
    }
    throw err;
  });

  await prisma.serviceRequest.update({
    where: { id: requestId },
    data: { status: 'QUOTED' },
  });

  // Notify customer about new quote
  const providerUserId = (session.user as any).id;
  const customerProfile = await prisma.customerProfile.findUnique({
    where: { id: serviceRequest.customerId },
    select: { userId: true },
  });
  if (customerProfile) {
    const providerUser = await prisma.user.findUnique({ where: { id: providerUserId }, select: { name: true } });
    createNotification({
      userId: customerProfile.userId,
      type: 'quote',
      title: 'New quote received',
      body: `${providerUser?.name ?? 'A pro'} sent you a quote for €${parsedPrice.toFixed(0)}`,
      href: `/requests/${requestId}`,
    });
  }

  // Auto-create chat thread between provider and customer (if not exists)
  if (customerProfile) {
    try {
      // Try scalar WHERE first; fall back to participants if columns don't exist yet
      const existingThread = await prisma.chatThread.findFirst({
        where: { requestId, customerId: customerProfile.userId, providerId: providerUserId },
        select: { id: true },
      }).catch(async () =>
        prisma.chatThread.findFirst({
          where: {
            requestId,
            AND: [
              { participants: { some: { id: providerUserId } } },
              { participants: { some: { id: customerProfile.userId } } },
            ],
          },
          select: { id: true },
        }).catch(() => null)
      );

      if (!existingThread) {
        await prisma.chatThread.create({
          data: {
            requestId,
            customerId: customerProfile.userId,
            providerId: providerUserId,
            participants: {
              connect: [{ id: providerUserId }, { id: customerProfile.userId }],
            },
          },
        }).catch((err: any) => {
          // P2002 = concurrent create; the other writer already has the row.
          // Anything else is a real bug we want to see in logs rather than
          // silently swallow — the prior "create without scalars" fallback
          // violated the NOT NULL constraint added in 20260403 and always
          // failed, so thread creation appeared to succeed but never did.
          if (err?.code === 'P2002') return;
          console.error('[quotes POST] Failed to create chat thread:', err);
        });
      }
    } catch (err: any) {
      console.error('[quotes] Failed to create chat thread:', err);
    }
  }

  return NextResponse.json(quote);
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { quoteId, status } = body; // status: 'ACCEPTED' or 'DECLINED'

  if (status !== 'ACCEPTED' && status !== 'DECLINED') {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  // Explicit select (not include) so we can guard the new ServiceRequest
  // .timeOfDay column with a P2022 fallback per the migration-safety pattern.
  const QUOTE_SELECT = {
    id: true, price: true, providerId: true, requestId: true, status: true, expiresAt: true,
    request: {
      select: {
        id: true, customerId: true, status: true, dateWindow: true, timeOfDay: true,
        customer: { select: { userId: true } },
      },
    },
  } as const;
  const QUOTE_SELECT_NO_TOD = {
    id: true, price: true, providerId: true, requestId: true, status: true,
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
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('timeOfDay') || msg.includes('column') || msg.includes('P2022')) {
      return prisma.quote.findUnique({ where: { id: quoteId }, select: QUOTE_SELECT_NO_TOD });
    }
    throw err;
  });

  if (!quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
  }

  // Ownership: only the customer who posted the request may accept or decline
  // its quotes. Admin retained for moderation/repair flows.
  const callerId = (session.user as any).id;
  const callerRole = (session.user as any).role;
  if (callerRole !== 'ADMIN' && quote.request.customer?.userId !== callerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Only a PENDING quote can be actioned. Re-sending ACCEPTED for an already
  // accepted quote used to create a duplicate Booking + Payment on every call.
  if (quote.status !== 'PENDING') {
    return NextResponse.json({ error: `Quote already ${quote.status.toLowerCase()}` }, { status: 409 });
  }

  // Expired quotes can't be accepted (the provider set a validity window).
  if (status === 'ACCEPTED' && quote.expiresAt && new Date(quote.expiresAt) < new Date()) {
    return NextResponse.json(
      { error: 'This quote has expired. Ask the pro for a new quote or pick another one.' },
      { status: 409 },
    );
  }

  // Request-level double-booking guard: a request yields at most one booking.
  // Without this, a customer could accept a second (still-PENDING) quote on a
  // request that already has an accepted quote/booking → duplicate Booking +
  // Payment + deposit demand for the same job.
  if (status === 'ACCEPTED') {
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
  const scheduledAt = status === 'ACCEPTED'
    ? buildVilniusScheduledAt(quote.request.dateWindow, quote.request.timeOfDay ?? null)
    : quote.request.dateWindow;

  // Enforce provider availability (blackout dates / working hours / buffer)
  // before committing. Degrades to allow on un-migrated DBs.
  if (status === 'ACCEPTED') {
    const avail = await checkAvailability(quote.providerId, scheduledAt);
    if (!avail.ok) {
      return NextResponse.json({ error: avail.reason }, { status: 409 });
    }
  }

  const updatedQuote = await prisma.quote.update({
    where: { id: quoteId },
    data: { status },
  });

  if (status === 'ACCEPTED') {
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
      }
    }

    const depositAmount = quote.price * DEPOSIT_RATE;

    // Try with depositAmount (new column); fall back to without if migration not applied
    const booking = await prisma.booking.create({
      data: {
        customerId: quote.request.customerId,
        providerId: quote.providerId,
        quoteId: quote.id,
        scheduledAt,
        totalAmount: quote.price,
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
            totalAmount: quote.price,
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
        amount: quote.price,
        depositAmount,
        platformFee: quote.price * PLATFORM_FEE_RATE,
        status: 'PENDING',
      },
      select: { id: true },
    }).catch(async (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('depositAmount') || msg.includes('platformFee') || msg.includes('column') || msg.includes('P2022')) {
        console.warn('[quotes PATCH] new payment columns missing, creating payment without them');
        await prisma.payment.create({
          data: { bookingId: booking.id, amount: quote.price, status: 'PENDING' },
          select: { id: true },
        }).catch(() => {});
      }
    });

    // Lock the chat thread until deposit is paid
    await prisma.chatThread.updateMany({
      where: { requestId: quote.requestId },
      data: { isLocked: true },
    }).catch(() => {}); // non-fatal if isLocked column not yet in DB

    // Notify provider that their quote was accepted
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
        title: 'Quote accepted!',
        body: `${customerUser?.name ?? 'A customer'} accepted your quote for €${quote.price.toFixed(0)}. Waiting for deposit.`,
        href: `/provider/jobs/${booking.id}`,
      });
    }

    // Notify customer to pay deposit
    const customerProfile = await prisma.customerProfile.findUnique({
      where: { id: quote.request.customerId },
      select: { userId: true },
    });
    if (customerProfile) {
      createNotification({
        userId: customerProfile.userId,
        type: 'payment',
        title: 'Pay deposit to confirm booking',
        body: `Pay €${depositAmount.toFixed(2)} deposit (20%) to lock in your booking and unlock messaging.`,
        href: `/bookings/${booking.id}`,
      });
    }

    return NextResponse.json({ ...updatedQuote, bookingId: booking.id });
  }

  return NextResponse.json(updatedQuote);
}
