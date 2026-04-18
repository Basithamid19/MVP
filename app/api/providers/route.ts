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

// Explicit select for ProviderProfile that only includes pre-migration columns.
// Used as a fallback when new Stripe columns don't exist in the DB yet.
const PROVIDER_CORE_SELECT = {
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
  bufferMins: true,
  blackoutDates: true,
} as const;

function isColumnError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('stripeAccountId') || msg.includes('stripeOnboarded') ||
    msg.includes('column') || msg.includes('P2022')
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const category = searchParams.get('category');
  const verified = searchParams.get('verified');

  if (id) {
    const singleInclude = {
      user: true,
      categories: true,
      offerings: true,
      availability: true,
      reviews: {
        where: { isHidden: false },
        include: { customer: { include: { user: true } } },
        orderBy: { createdAt: 'desc' } as const,
        take: 20,
      },
      _count: { select: { bookings: true, reviews: true } },
    };

    const provider = await prisma.providerProfile.findUnique({
      where: { id },
      include: singleInclude,
    }).catch(async (err: unknown) => {
      if (!isColumnError(err)) throw err;
      console.warn('[providers GET] new columns missing, using core select for single provider');
      return prisma.providerProfile.findUnique({
        where: { id },
        select: {
          ...PROVIDER_CORE_SELECT,
          user: true,
          categories: true,
          offerings: true,
          availability: true,
          reviews: {
            where: { isHidden: false },
            include: { customer: { include: { user: true } } },
            orderBy: { createdAt: 'desc' } as const,
            take: 20,
          },
          _count: { select: { bookings: true, reviews: true } },
        },
      });
    });

    if (provider?.user && !provider.user.image) {
      const correctImage = PROVIDER_IMAGES[provider.user.email ?? ''];
      if (correctImage) {
        await prisma.user.update({ where: { id: provider.user.id }, data: { image: correctImage } });
        (provider.user as any).image = correctImage;
      }
    }
    return NextResponse.json(provider);
  }

  const homepage = searchParams.get('homepage');
  const where: any = {};
  if (category) {
    where.categories = { some: { slug: category } };
  }
  if (verified === 'true') {
    where.isVerified = true;
  }
  if (homepage === 'true') {
    where.completedJobs = { gte: 5 };
  }

  const browseInclude = {
    user: { select: { id: true, email: true, name: true, image: true } },
    categories: true,
  };

  const providers = await prisma.providerProfile.findMany({
    where,
    include: browseInclude,
    orderBy: { ratingAvg: 'desc' },
  }).catch(async (err: unknown) => {
    if (!isColumnError(err)) throw err;
    console.warn('[providers GET] new columns missing, using core select for browse');
    return prisma.providerProfile.findMany({
      where,
      select: {
        ...PROVIDER_CORE_SELECT,
        user: { select: { id: true, email: true, name: true, image: true } },
        categories: true,
      },
      orderBy: { ratingAvg: 'desc' },
    });
  });

  if (homepage === 'true') {
    providers.sort((a: any, b: any) => {
      if (a.isVerified !== b.isVerified) return a.isVerified ? -1 : 1;
      const scoreA = (a.ratingAvg ?? 0) * (a.completedJobs ?? 0);
      const scoreB = (b.ratingAvg ?? 0) * (b.completedJobs ?? 0);
      return scoreB - scoreA;
    });
  }

  const fixPromises = (providers as any[])
    .filter((p: any) => p.user && !p.user.image && PROVIDER_IMAGES[p.user.email ?? ''])
    .map((p: any) => prisma.user.update({
      where: { id: p.user.id },
      data: { image: PROVIDER_IMAGES[p.user.email] },
    }));
  if (fixPromises.length > 0) await Promise.all(fixPromises);

  const result = (providers as any[]).map((p: any) => ({
    ...p,
    user: p.user ? {
      ...p.user,
      image: p.user.image ?? PROVIDER_IMAGES[p.user.email ?? ''] ?? null,
    } : p.user,
  }));

  return NextResponse.json(result);
}
