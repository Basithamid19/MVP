import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await auth();
  if (!session || !session.user || (session.user as any).role !== 'PROVIDER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { requestId, price, estimatedHours, notes } = body;

  const provider = await prisma.providerProfile.findUnique({
    where: { userId: (session.user as any).id },
    include: { categories: { select: { id: true } } },
  });

  if (!provider) {
    return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 });
  }

  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    select: { categoryId: true, customerId: true },
  });

  if (!serviceRequest) {
    return NextResponse.json({ error: 'Service request not found' }, { status: 404 });
  }

  const providerCategoryIds = provider.categories.map(c => c.id);
  if (!providerCategoryIds.includes(serviceRequest.categoryId)) {
    return NextResponse.json(
      { error: 'You can only quote on requests that match your service categories' },
      { status: 403 },
    );
  }

  const quote = await prisma.quote.create({
    data: {
      requestId,
      providerId: provider.id,
      price: parseFloat(price),
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
      notes,
      status: 'PENDING',
    },
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
      body: `${providerUser?.name ?? 'A pro'} sent you a quote for €${parseFloat(price).toFixed(0)}`,
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

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      request: {
        include: { customer: { select: { userId: true } } },
      },
    },
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

  const updatedQuote = await prisma.quote.update({
    where: { id: quoteId },
    data: { status },
  });

  if (status === 'ACCEPTED') {
    await prisma.serviceRequest.update({
      where: { id: quote.requestId },
      data: { status: 'ACCEPTED' },
    });

    const depositAmount = quote.price * 0.2;

    // Try with depositAmount (new column); fall back to without if migration not applied
    const booking = await prisma.booking.create({
      data: {
        customerId: quote.request.customerId,
        providerId: quote.providerId,
        quoteId: quote.id,
        scheduledAt: quote.request.dateWindow,
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
            scheduledAt: quote.request.dateWindow,
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
        platformFee: quote.price * 0.1,
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
        href: `/provider/jobs`,
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
