import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Deliberately NOT `force-dynamic` — this endpoint has no session/cookie
// reads, so we want Vercel's edge cache to honor the Cache-Control headers
// set on each response. The query-string params still produce per-URL cache
// keys, so `?category=plumber` and `?homepage=true` cache independently.
export const dynamic = 'auto';

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

// `email` is selected for the internal PROVIDER_IMAGES portrait backfill only —
// it is stripped from the response before returning (public, edge-cached
// endpoint). instantBook/blackoutDates surface availability on the public
// profile; companyName/businessType are the newest columns and are guarded by
// SINGLE_SELECT_SAFE below. The `reviews` relation is intentionally NOT selected
// here — the profile page fetches reviews via /api/reviews and discarded this.
const SINGLE_SELECT = {
  ...BROWSE_SELECT,
  user: { select: { id: true, email: true, name: true, image: true, role: true } },
  instantBook: true,
  blackoutDates: true,
  companyName: true,
  businessType: true,
  offerings: true,
  availability: true,
  _count: { select: { bookings: true, reviews: true } },
} as const;

// Fallback for DBs that haven't run 20260703_add_provider_business_fields yet —
// drops only the brand-new companyName/businessType columns.
const SINGLE_SELECT_SAFE = {
  ...BROWSE_SELECT,
  user: { select: { id: true, email: true, name: true, image: true, role: true } },
  instantBook: true,
  blackoutDates: true,
  offerings: true,
  availability: true,
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
      const provider: any = await prisma.providerProfile.findUnique({
        where: { id },
        select: SINGLE_SELECT,
      }).catch(async (err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('companyName') || msg.includes('businessType') || msg.includes('column') || msg.includes('P2022')) {
          console.warn('[providers GET] business columns missing, retrying with safe select');
          return prisma.providerProfile.findUnique({ where: { id }, select: SINGLE_SELECT_SAFE });
        }
        throw err;
      });

      if (provider?.user && !provider.user.image) {
        const fallback = PROVIDER_IMAGES[provider.user.email ?? ''];
        if (fallback) {
          prisma.user.update({ where: { id: provider.user.id }, data: { image: fallback } })
            .catch((err) => console.warn('[providers GET] image backfill failed:', err));
          (provider.user as any).image = fallback;
        }
      }
      // Strip the internal-only email before returning (public endpoint).
      if (provider?.user) delete (provider.user as any).email;
      return NextResponse.json(provider, {
        headers: {
          // 30s fresh at edge, 2min stale-while-revalidate. Profile edits
          // become visible within 30s without hammering Postgres on every hit.
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
        },
      });
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
    // Then strip the internal-only email before returning (public endpoint).
    for (const p of withUser as any[]) {
      if (p.user && !p.user.image && PROVIDER_IMAGES[p.user.email ?? '']) {
        const fallback = PROVIDER_IMAGES[p.user.email];
        prisma.user.update({ where: { id: p.user.id }, data: { image: fallback } })
          .catch((err) => console.warn('[providers GET] image backfill failed:', err));
        p.user.image = fallback;
      }
      if (p.user) delete p.user.email;
    }

    return NextResponse.json(withUser, {
      headers: {
        // 60s fresh at edge, 5min stale-while-revalidate. Browse + homepage
        // Top-Rated are fine with minute-level freshness.
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
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
