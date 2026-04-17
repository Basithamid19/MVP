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
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: { include: { user: true } },
        provider: { include: { user: true, categories: true } },
        payment: true,
        review: true,
        quote: { include: { request: { include: { category: true } } } },
      },
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
  const { bookingId, status } = body; // e.g., 'COMPLETED', 'CANCELED'

  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: { status },
  });

  // Fetch related data for notifications
  const fullBooking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: { include: { user: { select: { id: true, name: true } } } },
      provider: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  if (status === 'COMPLETED') {
    await prisma.providerProfile.update({
      where: { id: booking.providerId },
      data: { completedJobs: { increment: 1 } },
    });

    // Release remaining balance to provider (80% minus the deposit already collected)
    const payment = await prisma.payment.findUnique({
      where: { bookingId },
      include: { booking: { include: { provider: { select: { stripeAccountId: true, stripeOnboarded: true } } } } },
    });

    if (payment?.status === 'DEPOSIT_HELD' && payment.stripeIntentId && payment.booking.provider.stripeAccountId) {
      try {
        const remainingAmount = Math.round((booking.totalAmount - (payment.depositAmount ?? 0)) * 100);
        const platformFeeOnRemainder = Math.round(remainingAmount * 0.1);
        const chargeIntent = await stripe.paymentIntents.create({
          amount: remainingAmount,
          currency: 'eur',
          payment_method_types: ['card'],
          application_fee_amount: platformFeeOnRemainder,
          transfer_data: { destination: payment.booking.provider.stripeAccountId },
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
      });
    }

    // Notify customer: job completed
    if (fullBooking?.customer?.user) {
      createNotification({
        userId: fullBooking.customer.user.id,
        type: 'status',
        title: 'Job completed',
        body: `Your job with ${fullBooking.provider?.user?.name ?? 'your pro'} has been marked complete. Payment is processing.`,
        href: `/bookings/${bookingId}`,
      });
    }
    // Notify provider: payment processing
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
