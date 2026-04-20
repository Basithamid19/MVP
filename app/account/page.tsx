import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import AccountClient from './AccountClient';

export const dynamic = 'force-dynamic';

async function getInitialBookings(userId: string) {
  try {
    // Nested relation filter avoids a separate customerProfile.findUnique —
    // Postgres joins on the relation directly in one query.
    const bookings = await prisma.booking.findMany({
      where: { customer: { userId } },
      include: { provider: { include: { user: true } }, review: true },
      orderBy: { scheduledAt: 'desc' },
    });
    return JSON.parse(JSON.stringify(bookings));
  } catch (err) {
    console.warn('[account] initial bookings fetch failed — client will retry:', err);
    return [];
  }
}

export default async function Page() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const initialBookings = await getInitialBookings((session.user as any).id);
  return <AccountClient initialBookings={initialBookings} />;
}
