import prisma from '@/lib/prisma';
import ProviderProfileClient from './ProviderProfileClient';

// Provider profile is public, but we render dynamically so params.id changes
// aren't statically evaluated. The CDN-cached /api/providers path stays live
// for the client (reviews fetch, filter changes).
export const dynamic = 'force-dynamic';

// Mirror of SINGLE_SELECT / SINGLE_SELECT_SAFE in app/api/providers/route.ts.
// Kept explicit + migration-guarded per the CLAUDE.md pattern — a new
// companyName/businessType column on an un-migrated DB must not blank the page.
const SINGLE_SELECT = {
  id: true,
  userId: true,
  bio: true,
  serviceArea: true,
  languages: true,
  ratingAvg: true,
  completedJobs: true,
  isVerified: true,
  verificationTier: true,
  responseTime: true,
  instantBook: true,
  blackoutDates: true,
  companyName: true,
  businessType: true,
  offerings: true,
  availability: true,
  user: { select: { id: true, name: true, image: true, role: true } },
  categories: { select: { id: true, name: true, slug: true } },
  _count: { select: { bookings: true, reviews: true } },
} as const;

const SINGLE_SELECT_SAFE = {
  id: true,
  userId: true,
  bio: true,
  serviceArea: true,
  languages: true,
  ratingAvg: true,
  completedJobs: true,
  isVerified: true,
  verificationTier: true,
  responseTime: true,
  instantBook: true,
  blackoutDates: true,
  offerings: true,
  availability: true,
  user: { select: { id: true, name: true, image: true, role: true } },
  categories: { select: { id: true, name: true, slug: true } },
  _count: { select: { bookings: true, reviews: true } },
} as const;

async function getInitialProvider(id: string) {
  try {
    const provider = await prisma.providerProfile.findUnique({
      where: { id },
      select: SINGLE_SELECT,
    }).catch(async (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('companyName') || msg.includes('businessType') || msg.includes('column') || msg.includes('P2022')) {
        return prisma.providerProfile.findUnique({ where: { id }, select: SINGLE_SELECT_SAFE });
      }
      throw err;
    });
    return provider ? JSON.parse(JSON.stringify(provider)) : null;
  } catch (err) {
    console.warn('[providers/[id]] initial data fetch failed — client will retry:', err);
    return null;
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolved = 'then' in (params as any)
    ? await (params as Promise<{ id: string }>)
    : (params as { id: string });
  const initialProvider = await getInitialProvider(resolved.id);
  return <ProviderProfileClient initialProvider={initialProvider} />;
}
