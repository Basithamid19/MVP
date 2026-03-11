import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      include: { customer: { include: { user: true } } },
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

  if (status === 'COMPLETED') {
    await prisma.providerProfile.update({
      where: { id: booking.providerId },
      data: { completedJobs: { increment: 1 } },
    });
  }

  return NextResponse.json(booking);
}
