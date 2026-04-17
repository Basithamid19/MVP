import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    // Explicit select avoids selecting new columns (depositAmount, canceledAt on Booking;
    // stripeAccountId/stripeOnboarded on ProviderProfile; new Payment fields)
    // that may not exist in the DB until the migration runs.
    const BOOKING_DETAIL_SELECT = {
      id: true, customerId: true, providerId: true, quoteId: true,
      status: true, scheduledAt: true, totalAmount: true, createdAt: true,
      customer: { include: { user: true } },
      provider: { include: { user: true, categories: true } },
      payment: { select: { id: true, bookingId: true, amount: true, status: true, stripeSessionId: true, createdAt: true } },
      review: true,
      quote: { include: { request: { include: { category: true } } } },
    } as const;

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: BOOKING_DETAIL_SELECT,
    }).catch(async (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('column') || msg.includes('P2022')) {
        console.warn('[bookings GET] column error, retrying with safe select');
        return prisma.booking.findUnique({ where: { id }, select: BOOKING_DETAIL_SELECT }).catch(() => null);
      }
      return null;
    });

    if (!booking) return NextResponse.json(null);

    // Resolve the chat thread for this booking's request + customer + provider
    let chatThread = null;
    if (booking.quote?.requestId && booking.customer?.userId && booking.provider?.userId) {
      try {
        // Try with new scalar fields first
        chatThread = await prisma.chatThread.findFirst({
          where: {
            requestId: booking.quote.requestId,
            customerId: booking.customer.userId,
            providerId: booking.provider.userId,
          },
          select: { id: true },
        });
      } catch {
        // Fallback: old participants-based lookup
        chatThread = await prisma.chatThread.findFirst({
          where: {
            requestId: booking.quote.requestId,
            AND: [
              { participants: { some: { id: booking.customer.userId } } },
              { participants: { some: { id: booking.provider.userId } } },
            ],
          },
          select: { id: true },
        });
      }
    }

    return NextResponse.json({ ...booking, chatThread });
  }

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  if (role === 'CUSTOMER') {
    const customer = await prisma.customerProfile.findUnique({ where: { userId } });
    if (!customer) return NextResponse.json([]);
    const bookings = await prisma.booking.findMany({
      where: { customerId: customer.id },
      include: { provider: { include: { user: true } }, review: true },
      orderBy: { scheduledAt: 'desc' },
    });
    return NextResponse.json(bookings);
  } else if (role === 'PROVIDER') {
    const provider = await prisma.providerProfile.findUnique({ where: { userId } });
    if (!provider) return NextResponse.json([]);
    const bookings = await prisma.booking.findMany({
      where: { providerId: provider.id },
      include: {
        customer: { include: { user: true } },
        quote: { include: { request: { include: { category: true } } } },
        payment: true,
        review: true,
      },
      orderBy: { scheduledAt: 'desc' },
    });
    return NextResponse.json(bookings);
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { bookingId, status } = body;

  // Use explicit select to avoid failing on new columns (depositAmount, canceledAt)
  // that may not exist in the DB until the migration runs.
  const BOOKING_SAFE_SELECT = {
    id: true, status: true, providerId: true,
    customerId: true, totalAmount: true, scheduledAt: true, quoteId: true, createdAt: true,
  } as const;

  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: { status },
    select: BOOKING_SAFE_SELECT,
  });

  // Fetch notification data using precise selects — avoids new ProviderProfile columns
  const fullBooking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      customer: { select: { user: { select: { id: true, name: true } } } },
      provider: { select: { user: { select: { id: true, name: true } } } },
    },
  });

  if (status === 'COMPLETED') {
    await prisma.providerProfile.update({
      where: { id: booking.providerId },
      data: { completedJobs: { increment: 1 } },
      select: { id: true },
    });

    // Attempt payment release — wrapped in try-catch because new payment/provider
    // columns (stripeIntentId, stripeAccountId, etc.) may not exist in the DB yet.
    try {
      const payment = await prisma.payment.findUnique({
        where: { bookingId },
        select: {
          id: true, status: true, stripeIntentId: true,
          depositAmount: true, bookingId: true,
          booking: { select: { provider: { select: { stripeAccountId: true, stripeOnboarded: true } } } },
        },
      });

      if (payment?.status === 'DEPOSIT_HELD' && (payment as any).stripeIntentId && (payment as any).booking?.provider?.stripeAccountId) {
        const remainingAmount = Math.round((booking.totalAmount - ((payment as any).depositAmount ?? 0)) * 100);
        const platformFeeOnRemainder = Math.round(remainingAmount * 0.1);
        try {
          const chargeIntent = await stripe.paymentIntents.create({
            amount: remainingAmount,
            currency: 'eur',
            payment_method_types: ['card'],
            application_fee_amount: platformFeeOnRemainder,
            transfer_data: { destination: (payment as any).booking.provider.stripeAccountId },
            metadata: { bookingId, type: 'final_payment' },
          });
          await prisma.payment.update({
            where: { bookingId },
            data: { status: 'PAID', stripeChargeId: chargeIntent.id },
          });
        } catch (stripeErr) {
          console.error('[bookings PATCH COMPLETED] Stripe final payment failed:', stripeErr);
          await prisma.payment.update({ where: { bookingId }, data: { status: 'PROCESSING' } });
        }
      } else if (!payment) {
        await prisma.payment.create({
          data: { bookingId, amount: booking.totalAmount, status: 'PROCESSING' },
          select: { id: true },
        });
      }
    } catch (paymentErr: unknown) {
      const msg = paymentErr instanceof Error ? paymentErr.message : String(paymentErr);
      if (msg.includes('column') || msg.includes('stripeIntentId') || msg.includes('depositAmount') || msg.includes('stripeAccountId') || msg.includes('P2022')) {
        console.warn('[bookings PATCH COMPLETED] new payment columns missing, creating fallback payment record');
        const existing = await prisma.payment.findUnique({ where: { bookingId }, select: { id: true } }).catch(() => null);
        if (!existing) {
          await prisma.payment.create({
            data: { bookingId, amount: booking.totalAmount, status: 'PROCESSING' },
            select: { id: true },
          });
        }
      } else {
        console.error('[bookings PATCH COMPLETED] payment release error:', paymentErr);
      }
    }

    if (fullBooking?.customer?.user) {
      createNotification({
        userId: fullBooking.customer.user.id,
        type: 'status',
        title: 'Job completed',
        body: `Your job with ${fullBooking.provider?.user?.name ?? 'your pro'} has been marked complete. Payment is processing.`,
        href: `/bookings/${bookingId}`,
      });
    }
    if (fullBooking?.provider?.user) {
      createNotification({
        userId: fullBooking.provider.user.id,
        type: 'payment',
        title: 'Payment processing',
        body: `€${booking.totalAmount.toFixed(2)} is being processed for your completed job.`,
        href: `/provider/earnings`,
      });
    }
  }

  if (status === 'IN_PROGRESS' && fullBooking?.customer?.user) {
    createNotification({
      userId: fullBooking.customer.user.id,
      type: 'booking',
      title: 'Job started',
      body: `${fullBooking.provider?.user?.name ?? 'Your pro'} has started working on your job.`,
      href: `/bookings/${bookingId}`,
    });
  }

  return NextResponse.json(booking);
}
