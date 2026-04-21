import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

// Scalar-only select that has existed since the initial migration. Used as the
// fallback read when the relation-joined primary query throws — mirrors
// SAFE_SCALAR_SELECT in app/api/provider/profile/route.ts.
const SCALAR_PROFILE_SELECT = {
  id: true,
  bio: true,
  serviceArea: true,
  ratingAvg: true,
  completedJobs: true,
  verificationTier: true,
} as const;

export default async function ProviderDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userId = (session.user as any).id;
  if (!userId) redirect('/login');

  const initialUser = {
    name: session.user.name ?? null,
    image: session.user.image ?? null,
  };

  let initialProfile: any | null = null;
  let initialLeads: any[] = [];
  let initialBookings: any[] = [];
  let loadError = false;

  // --- Profile: primary (with relations) → scalar fallback. Only a failure of
  // the scalar fallback sets loadError=true. A null scalar result means "no
  // profile row yet" — a legitimate empty state, not a load failure.
  try {
    initialProfile = await prisma.providerProfile.findUnique({
      where: { userId },
      select: {
        ...SCALAR_PROFILE_SELECT,
        categories: { select: { id: true, name: true } },
        offerings: { select: { id: true } },
      },
    });
  } catch (primaryErr) {
    console.warn(
      '[provider/dashboard] primary profile query failed, trying scalar fallback:',
      primaryErr instanceof Error ? primaryErr.message.slice(0, 200) : String(primaryErr),
    );
    try {
      const scalar = await prisma.providerProfile.findUnique({
        where: { userId },
        select: SCALAR_PROFILE_SELECT,
      });
      if (scalar) {
        const [categories, offerings] = await Promise.all([
          prisma.serviceCategory.findMany({
            where: { providers: { some: { userId } } },
            select: { id: true, name: true },
          }).catch(() => []),
          prisma.serviceOffering.findMany({
            where: { providerProfileId: scalar.id },
            select: { id: true },
          }).catch(() => []),
        ]);
        initialProfile = { ...scalar, categories, offerings };
      }
      // scalar === null → no profile row; initialProfile stays null (empty state)
    } catch (fallbackErr) {
      console.error('[provider/dashboard] scalar fallback profile query failed:', fallbackErr);
      loadError = true;
    }
  }

  // --- Leads & bookings: fail-soft to [] so a transient error on one of
  // them does not zero-out the entire dashboard.
  if (initialProfile) {
    const categoryIds = (initialProfile.categories ?? []).map((c: any) => c.id);
    const categoryFilter = categoryIds.length > 0
      ? { categoryId: { in: categoryIds } }
      : {};

    const [leads, bookings] = await Promise.all([
      prisma.serviceRequest.findMany({
        where: {
          ...categoryFilter,
          status: { in: ['NEW', 'QUOTED'] },
          quotes: { none: { providerId: initialProfile.id } },
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
      }).catch((err) => {
        console.error('[provider/dashboard] leads query failed:', err);
        return [];
      }),
      prisma.booking.findMany({
        where: { providerId: initialProfile.id },
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
      }).catch((err) => {
        console.error('[provider/dashboard] bookings query failed:', err);
        return [];
      }),
    ]);

    initialLeads = leads;
    initialBookings = bookings;
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
