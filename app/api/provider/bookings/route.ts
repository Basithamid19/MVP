import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/provider/bookings
 * Returns the authenticated provider's completed bookings for invoice display.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await prisma.providerProfile.findUnique({
    where: { userId: (session.user as any).id },
    select: { id: true },
  });

  if (!profile) return NextResponse.json([]);

  const bookings = await prisma.booking.findMany({
    where: {
      providerId: profile.id,
      status: 'COMPLETED',
    },
    include: {
      customer: {
        include: {
          user: { select: { name: true } },
        },
      },
      quote: {
        include: {
          request: {
            include: {
              category: { select: { name: true } },
            },
          },
        },
      },
      payment: true,
    },
    orderBy: { scheduledAt: 'desc' },
    take: 50,
  });

  return NextResponse.json(bookings);
}
