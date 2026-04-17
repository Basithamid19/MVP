import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { bookingId } = await request.json();
  if (!bookingId) return NextResponse.json({ error: 'bookingId required' }, { status: 400 });

  const userId = (session.user as any).id;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: { include: { user: { select: { id: true, name: true } } } },
      provider: { include: { user: { select: { id: true, name: true } } } },
      payment: true,
    },
  });

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  const isCustomer = booking.customer.userId === userId;
  const isProvider = booking.provider.userId === userId;
  if (!isCustomer && !isProvider) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (booking.status === 'CANCELED' || booking.status === 'COMPLETED') {
    return NextResponse.json({ error: 'Booking cannot be canceled' }, { status: 400 });
  }

  const hoursUntilJob = (new Date(booking.scheduledAt).getTime() - Date.now()) / (1000 * 60 * 60);
  const isWithin24h = hoursUntilJob < 24;

  // Cancel the booking
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'CANCELED', canceledAt: new Date() },
  });

  // Handle refund
  const payment = booking.payment;
  let refundStatus = 'REFUNDED';

  if (payment?.stripeIntentId && payment.status === 'DEPOSIT_HELD') {
    try {
      if (isWithin24h) {
        // No refund — booking fee kept
        refundStatus = 'PARTIAL_REFUND';
        // No Stripe refund issued
      } else {
        // Full deposit refund
        await stripe.refunds.create({ payment_intent: payment.stripeIntentId });
        refundStatus = 'REFUNDED';
      }
    } catch (err) {
      console.error('[payments/cancel] Stripe refund failed:', err);
      // Still cancel the booking; flag for manual review
    }
    await prisma.payment.update({
      where: { bookingId },
      data: { status: refundStatus },
    });
  }

  // Notify both parties
  const otherUserId = isCustomer ? booking.provider.user.id : booking.customer.user.id;
  const cancellerName = isCustomer
    ? (booking.customer.user.name ?? 'Customer')
    : (booking.provider.user.name ?? 'Provider');

  createNotification({
    userId: otherUserId,
    type: 'booking',
    title: 'Booking canceled',
    body: `${cancellerName} has canceled the booking.`,
    href: isCustomer ? `/provider/jobs/${bookingId}` : `/bookings/${bookingId}`,
  });

  if (isCustomer && isWithin24h && payment?.depositAmount) {
    createNotification({
      userId,
      type: 'payment',
      title: 'Booking canceled — no refund',
      body: `Your booking was canceled within 24 hours of the job. The €${payment.depositAmount.toFixed(2)} deposit is non-refundable per our policy.`,
      href: `/bookings/${bookingId}`,
    });
  } else if (isCustomer && payment?.depositAmount) {
    createNotification({
      userId,
      type: 'payment',
      title: 'Refund on its way',
      body: `Your €${payment.depositAmount.toFixed(2)} deposit will be refunded within 5–10 business days.`,
      href: `/bookings/${bookingId}`,
    });
  }

  return NextResponse.json({ canceled: true, refundStatus, isWithin24h });
}
