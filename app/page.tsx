import HomePageClient from './HomePageClient';
import prisma from '@/lib/prisma';

// Server-rendered wrapper. Fetches the top providers on the server so the
// HTML streams with the Top-Rated section already populated — no client-side
// fetch, no flash of skeletons. The inner component is still a client
// component for interactivity (search, testimonial swipe, session-aware UI).
//
// revalidate=60 pairs with the Cache-Control on /api/providers so the two
// render paths stay in sync: users get a minute-fresh view either way.
export const revalidate = 60;

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
  user: { select: { id: true, email: true, name: true, image: true } },
  categories: { select: { id: true, name: true, slug: true } },
} as const;

async function getTopPros() {
  try {
    const providers = await prisma.providerProfile.findMany({
      select: BROWSE_SELECT,
      orderBy: { ratingAvg: 'desc' },
      take: 12,
    });
    const withUser = providers.filter((p) => p.user != null);
    withUser.sort((a: any, b: any) => {
      if (a.isVerified !== b.isVerified) return a.isVerified ? -1 : 1;
      const scoreA = (a.ratingAvg ?? 0) * (a.completedJobs ?? 0);
      const scoreB = (b.ratingAvg ?? 0) * (b.completedJobs ?? 0);
      return scoreB - scoreA;
    });
    return withUser.slice(0, 4);
  } catch (err) {
    console.warn('[homepage] top pros fetch failed — client will retry:', err);
    return [];
  }
}

export default async function Page() {
  const initialTopPros = await getTopPros();
  return <HomePageClient initialTopPros={initialTopPros} />;
}
