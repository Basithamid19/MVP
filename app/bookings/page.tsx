import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { withPublicImages } from '@/lib/safe-image';
import BookingsClient from './BookingsClient';

// Logged-in, per-user page — can't edge-cache. Server-render the initial
// bookings so the HTML streams with content in place, skipping the client-side
// useEffect fetch on first paint. Matches the dashboard/account RSC shape.
export const dynamic = 'force-dynamic';

async function getInitialData(userId: string) {
  try {
    const bookings = await prisma.booking.findMany({
      where: { customer: { userId } },
      include: {
        provider: { include: { user: { select: { id: true, name: true, image: true } } } },
        review: true,
        quote: { include: { request: { include: { category: true } } } },
      },
      orderBy: { scheduledAt: 'desc' },
    });
    // Legacy base64 data-URL avatars are dropped before the payload is
    // inlined into the streamed HTML (lib/safe-image.ts).
    return { initialBookings: JSON.parse(JSON.stringify(withPublicImages(bookings))) };
  } catch (err) {
    console.warn('[bookings] initial data fetch failed — client will retry:', err);
    return { initialBookings: [] };
  }
}

export default async function Page() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if ((session.user as any).role === 'PROVIDER') redirect('/provider/dashboard');

  const data = await getInitialData((session.user as any).id);
  return <BookingsClient {...data} />;
}
