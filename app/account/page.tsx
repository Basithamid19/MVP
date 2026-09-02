import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { withPublicImages } from '@/lib/safe-image';
import AccountClient from './AccountClient';

export const dynamic = 'force-dynamic';

async function getInitialBookings(userId: string) {
  try {
    // Nested relation filter avoids a separate customerProfile.findUnique —
    // Postgres joins on the relation directly in one query.
    const bookings = await prisma.booking.findMany({
      where: { customer: { userId } },
      include: { provider: { include: { user: { select: { id: true, name: true, image: true } } } }, review: true },
      orderBy: { scheduledAt: 'desc' },
    });
    // Legacy base64 data-URL avatars are dropped before the payload is
    // inlined into the streamed HTML (lib/safe-image.ts).
    return JSON.parse(JSON.stringify(withPublicImages(bookings)));
  } catch (err) {
    console.warn('[account] initial bookings fetch failed — client will retry:', err);
    return [];
  }
}

export default async function Page() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  // Customer-only surface. middleware.ts redirects first, but this is the
  // defense-in-depth gate for any request that bypasses it.
  const role = (session.user as any).role;
  if (role === 'PROVIDER') redirect('/provider/dashboard');
  if (role === 'ADMIN') redirect('/admin/dashboard');

  const initialBookings = await getInitialBookings((session.user as any).id);
  return <AccountClient initialBookings={initialBookings} />;
}
