import prisma from '@/lib/prisma';
import BrowseClient from './BrowseClient';

// This route reads the URL's `?category=…` and per-request is user-agnostic —
// but the client component still reruns fetches when the customer toggles
// filters, so `dynamic` is left on to keep RSC data behind session/CDN rules.
export const dynamic = 'force-dynamic';

// Explicit, migration-safe select. Mirror of BROWSE_SELECT in
// app/api/providers/route.ts — kept in sync there. Covers only columns
// guaranteed to exist across every migration state.
const BROWSE_SELECT = {
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
  user: { select: { id: true, name: true, image: true } },
  categories: { select: { id: true, name: true, slug: true } },
} as const;

async function getInitialProviders(category: string | undefined) {
  try {
    const where: Record<string, unknown> = {};
    if (category) where.categories = { some: { slug: category } };

    const providers = await prisma.providerProfile.findMany({
      where,
      select: BROWSE_SELECT,
      orderBy: { ratingAvg: 'desc' },
    });
    // Drop rows without a user relation — same defensive filter the API uses.
    const withUser = providers.filter(p => p.user != null);
    return JSON.parse(JSON.stringify(withUser));
  } catch (err) {
    console.warn('[browse] initial data fetch failed — client will refetch:', err);
    return [];
  }
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }> | { category?: string };
}) {
  // Next 15 gives searchParams as a Promise; also handle the sync shape.
  const params = 'then' in (searchParams as any)
    ? await (searchParams as Promise<{ category?: string }>)
    : (searchParams as { category?: string });
  const initialProviders = await getInitialProviders(params?.category);
  return <BrowseClient initialProviders={initialProviders} />;
}
