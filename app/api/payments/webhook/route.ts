import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.text();
  const sig = (await headers()).get('stripe-signature');

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('[webhook] signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const bookingId = session.metadata?.bookingId;
    if (!bookingId) return NextResponse.json({ received: true });

    const stripeIntentId = session.payment_intent;

    // Mark deposit as held
    await prisma.payment.update({
      where: { bookingId },
      data: { status: 'DEPOSIT_HELD', stripeIntentId, stripeSessionId: session.id },
    });

    // Unlock chat thread for this booking's quote/request
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        quote: { include: { request: true } },
        provider: { include: { user: { select: { id: true } } } },
        customer: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    if (booking?.quote?.requestId) {
      await prisma.chatThread.updateMany({
        where: { requestId: booking.quote.requestId },
        data: { isLocked: false },
      });
    }

    // Notify provider
    if (booking?.provider?.user?.id) {
      createNotification({
        userId: booking.provider.user.id,
        type: 'payment',
        title: 'Booking confirmed!',
        body: `${booking.customer.user.name ?? 'Customer'} paid the deposit. Your job is confirmed.`,
        href: `/provider/jobs/${bookingId}`,
      });
    }

    // Notify customer
    if (booking?.customer?.user?.id) {
      createNotification({
        userId: booking.customer.user.id,
        type: 'payment',
        title: 'Deposit received',
        body: 'Your deposit was processed. You can now message your provider.',
        href: `/bookings/${bookingId}`,
      });
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object as any;
    const bookingId = intent.metadata?.bookingId;
    if (!bookingId) return NextResponse.json({ received: true });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: { include: { user: { select: { id: true } } } } },
    });

    if (booking?.customer?.user?.id) {
      createNotification({
        userId: booking.customer.user.id,
        type: 'payment',
        title: 'Payment failed',
        body: 'Your deposit payment failed. Please try again to confirm your booking.',
        href: `/bookings/${bookingId}`,
      });
    }
  }

  return NextResponse.json({ received: true });
}
