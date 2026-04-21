import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function ProviderDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userId = (session.user as any).id;
  const initialUser = {
    name: session.user.name ?? null,
    image: session.user.image ?? null,
  };

  let initialProfile: any | null = null;
  let initialLeads: any[] = [];
  let initialBookings: any[] = [];
  let loadError = false;

  try {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        bio: true,
        serviceArea: true,
        ratingAvg: true,
        completedJobs: true,
        verificationTier: true,
        categories: { select: { id: true, name: true } },
        offerings: { select: { id: true } },
      },
    });

    initialProfile = profile;

    if (profile) {
      const categoryIds = profile.categories.map((c) => c.id);
      const categoryFilter = categoryIds.length > 0
        ? { categoryId: { in: categoryIds } }
        : {};

      const [leads, bookings] = await Promise.all([
        prisma.serviceRequest.findMany({
          where: {
            ...categoryFilter,
            status: { in: ['NEW', 'QUOTED'] },
            quotes: { none: { providerId: profile.id } },
          },
          include: {
            category: true,
            quotes: { select: { id: true } },
          },
          orderBy: [
            { isUrgent: 'desc' },
            { createdAt: 'desc' },
          ],
          take: 50,
        }),
        prisma.booking.findMany({
          where: { providerId: profile.id },
          select: {
            id: true,
            status: true,
            scheduledAt: true,
            totalAmount: true,
            quote: {
              select: {
                request: {
                  select: { category: { select: { name: true } } },
                },
              },
            },
          },
          orderBy: { scheduledAt: 'desc' },
        }),
      ]);

      initialLeads = leads;
      initialBookings = bookings;
    }
    // No profile row → leave leads/bookings as []. Real empty state, not a load failure.
  } catch (err) {
    console.error('[provider/dashboard] server fetch failed:', err);
    loadError = true;
    // initialProfile/leads/bookings stay at their defaults; client shows the error banner
  }

  return (
    <DashboardClient
      initialUser={initialUser}
      initialProfile={initialProfile}
      initialLeads={initialLeads}
      initialBookings={initialBookings}
      loadError={loadError}
    />
  );
}
