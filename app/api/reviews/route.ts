import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const providerId = searchParams.get('providerId');
  if (!providerId) return NextResponse.json([]);

  const reviews = await prisma.review.findMany({
    where: { providerId },
    orderBy: { createdAt: 'desc' },
    include: {
      customer: { include: { user: { select: { name: true } } } },
    },
  });
  return NextResponse.json(reviews);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { bookingId, rating, comment } = body;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { customer: { select: { userId: true } } },
  });

  if (!booking || booking.status !== 'COMPLETED') {
    return NextResponse.json({ error: 'Only completed bookings can be reviewed' }, { status: 400 });
  }

  // Ownership: only the customer who owns the booking may review it. Without
  // this, any authenticated user who knew a completed bookingId could submit
  // a review on the customer's behalf (review fraud).
  const callerId = (session.user as any).id;
  if (booking.customer?.userId !== callerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const review = await prisma.review.create({
    data: {
      bookingId,
      customerId: booking.customerId,
      providerId: booking.providerId,
      rating: parseInt(rating),
      comment,
    },
  });

  // Update provider average rating
  const reviews = await prisma.review.findMany({
    where: { providerId: booking.providerId },
  });
  const avg = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

  await prisma.providerProfile.update({
    where: { id: booking.providerId },
    data: { ratingAvg: avg },
  });

  return NextResponse.json(review);
}
