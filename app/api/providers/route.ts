import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const PROVIDER_IMAGES: Record<string, string> = {
  'marius@pro.lt':  'https://randomuser.me/api/portraits/men/10.jpg',
  'tomas@pro.lt':   'https://randomuser.me/api/portraits/men/20.jpg',
  'lina@pro.lt':    'https://randomuser.me/api/portraits/women/32.jpg',
  'andrius@pro.lt': 'https://randomuser.me/api/portraits/men/30.jpg',
  'vytas@pro.lt':   'https://randomuser.me/api/portraits/men/45.jpg',
  'paulius@pro.lt': 'https://randomuser.me/api/portraits/men/52.jpg',
  'rokas@pro.lt':   'https://randomuser.me/api/portraits/men/16.jpg',
  'darius@pro.lt':  'https://randomuser.me/api/portraits/men/25.jpg',
};

// Explicit select covering only columns guaranteed to exist across every
// migration state. Avoids the implicit SELECT * that `include` performs, which
// fails with P2022 if any newer column (stripeAccountId, stripeOnboarded, etc.)
// is missing from the deployed DB.
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

const SINGLE_SELECT = {
  ...BROWSE_SELECT,
  user: { select: { id: true, email: true, name: true, image: true, role: true } },
  offerings: true,
  availability: true,
  reviews: {
    where: { isHidden: false },
    include: { customer: { include: { user: true } } },
    orderBy: { createdAt: 'desc' } as const,
    take: 20,
  },
  _count: { select: { bookings: true, reviews: true } },
} as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const category = searchParams.get('category');
  const verified = searchParams.get('verified');
  const homepage = searchParams.get('homepage');

  // ── Single-provider lookup ────────────────────────────────────────────
  if (id) {
    try {
      const provider = await prisma.providerProfile.findUnique({
        where: { id },
        select: SINGLE_SELECT,
      });

      if (provider?.user && !provider.user.image) {
        const fallback = PROVIDER_IMAGES[provider.user.email ?? ''];
        if (fallback) {
          prisma.user.update({ where: { id: provider.user.id }, data: { image: fallback } })
            .catch((err) => console.warn('[providers GET] image backfill failed:', err));
          (provider.user as any).image = fallback;
        }
      }
      return NextResponse.json(provider);
    } catch (err) {
      console.error('[providers GET id=' + id + '] failed:', err);
      return NextResponse.json(null, { status: 500 });
    }
  }

  // ── List/browse ───────────────────────────────────────────────────────
  const where: Record<string, unknown> = {};
  if (category) where.categories = { some: { slug: category } };
  if (verified === 'true') where.isVerified = true;
  if (homepage === 'true') where.completedJobs = { gte: 5 };

  try {
    const providers = await prisma.providerProfile.findMany({
      where,
      select: BROWSE_SELECT,
      orderBy: { ratingAvg: 'desc' },
    });

    console.log('[providers GET]', {
      where,
      returned: providers.length,
    });

    // Drop any rows where the user relation failed to load. Defensive —
    // Prisma's cascade makes this unlikely, but if the DB is ever in an
    // inconsistent state we want the list to render anyway.
    const withUser = providers.filter((p) => p.user != null);

    // Homepage sort: verified first, then rating × completedJobs.
    if (homepage === 'true') {
      withUser.sort((a: any, b: any) => {
        if (a.isVerified !== b.isVerified) return a.isVerified ? -1 : 1;
        const scoreA = (a.ratingAvg ?? 0) * (a.completedJobs ?? 0);
        const scoreB = (b.ratingAvg ?? 0) * (b.completedJobs ?? 0);
        return scoreB - scoreA;
      });
    }

    // Image backfill is fire-and-forget — never block or fail the response.
    for (const p of withUser as any[]) {
      if (p.user && !p.user.image && PROVIDER_IMAGES[p.user.email ?? '']) {
        const fallback = PROVIDER_IMAGES[p.user.email];
        prisma.user.update({ where: { id: p.user.id }, data: { image: fallback } })
          .catch((err) => console.warn('[providers GET] image backfill failed:', err));
        p.user.image = fallback;
      }
    }

    return NextResponse.json(withUser);
  } catch (err) {
    console.error('[providers GET] query failed:', {
      where,
      message: err instanceof Error ? err.message : String(err),
    });
    // Return an empty array (not 500) so the UI renders its empty state
    // instead of a generic error — client code expects an array here.
    return NextResponse.json([]);
  }
}
