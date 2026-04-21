import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { isColumnError } from '@/lib/prisma-errors';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'CUSTOMER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { bookingId } = await request.json();
  if (!bookingId) return NextResponse.json({ error: 'bookingId required' }, { status: 400 });

  // `stripeAccountId` / `stripeOnboarded` were added in migration 20260417.
  // If an environment is running this deploy before that migration lands,
  // Prisma throws P2022 from the `provider.select` below. Degrade to a 503
  // with a clear message instead of a bare 500.
  let booking;
  try {
    booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: { include: { user: { select: { email: true, name: true } } } },
        provider: { select: { id: true, stripeAccountId: true, stripeOnboarded: true } },
        quote: { include: { request: { include: { category: true } } } },
        payment: true,
      },
    });
  } catch (err) {
    if (isColumnError(err)) {
      console.error('[payments/checkout] stripe columns missing — migration pending:', err);
      return NextResponse.json(
        { error: 'Payments are being configured — please try again in a few minutes.' },
        { status: 503 },
      );
    }
    throw err;
  }

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  if (booking.customer.userId !== (session.user as any).id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (booking.payment?.status === 'DEPOSIT_HELD' || booking.payment?.status === 'PAID') {
    return NextResponse.json({ error: 'Already paid' }, { status: 400 });
  }
  if (!booking.provider.stripeOnboarded || !booking.provider.stripeAccountId) {
    return NextResponse.json({ error: 'Provider has not set up payouts yet.' }, { status: 400 });
  }

  const depositAmount = Math.round(booking.totalAmount * 0.2 * 100); // 20% in cents
  const platformFee = Math.round(booking.totalAmount * 0.1 * 100);   // 10% in cents
  const serviceName = booking.quote?.request?.category?.name ?? 'Service';
  const origin = request.headers.get('origin') ?? process.env.NEXTAUTH_URL ?? '';

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          unit_amount: depositAmount,
          product_data: {
            name: `Booking deposit — ${serviceName}`,
            description: '20% deposit to confirm your booking. Remaining balance due on completion.',
          },
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: platformFee,
      transfer_data: { destination: booking.provider.stripeAccountId },
      metadata: { bookingId, platformFee: String(platformFee) },
    },
    customer_email: booking.customer.user.email,
    metadata: { bookingId },
    success_url: `${origin}/bookings/${bookingId}?payment=success`,
    cancel_url: `${origin}/bookings/${bookingId}?payment=canceled`,
  });

  // Upsert the Payment record so the UI knows a checkout is in flight
  await prisma.payment.upsert({
    where: { bookingId },
    update: {
      stripeSessionId: checkoutSession.id,
      depositAmount: booking.totalAmount * 0.2,
      platformFee: booking.totalAmount * 0.1,
      status: 'PENDING',
    },
    create: {
      bookingId,
      amount: booking.totalAmount,
      depositAmount: booking.totalAmount * 0.2,
      platformFee: booking.totalAmount * 0.1,
      status: 'PENDING',
      stripeSessionId: checkoutSession.id,
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
