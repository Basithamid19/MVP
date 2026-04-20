import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import DashboardClient from './DashboardClient';

// Logged-in, per-user page — can't edge-cache. But we can still server-render
// the initial data so the HTML streams with the dashboard content in place,
// skipping the client-side useEffect fetch on first paint.
export const dynamic = 'force-dynamic';

async function getInitialData(userId: string) {
  try {
    // Nested relation filter skips the customerProfile.findUnique round-trip —
    // Postgres does the join in a single query instead of us resolving the
    // profile id client-side first.
    const [requests, bookings] = await Promise.all([
      prisma.serviceRequest.findMany({
        where: { customer: { userId } },
        include: { category: true, quotes: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.findMany({
        where: { customer: { userId } },
        include: { provider: { include: { user: true } }, review: true },
        orderBy: { scheduledAt: 'desc' },
      }),
    ]);

    return {
      initialRequests: JSON.parse(JSON.stringify(requests)),
      initialBookings: JSON.parse(JSON.stringify(bookings)),
    };
  } catch (err) {
    console.warn('[dashboard] initial data fetch failed — client will retry:', err);
    return { initialRequests: [], initialBookings: [] };
  }
}

export default async function Page() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const data = await getInitialData((session.user as any).id);
  return <DashboardClient {...data} />;
}
