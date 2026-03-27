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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const category = searchParams.get('category');
  const verified = searchParams.get('verified');

  if (id) {
    const provider = await prisma.providerProfile.findUnique({
      where: { id },
      include: {
        user: true,
        categories: true,
        offerings: true,
        availability: true,
        reviews: {
          where: { isHidden: false },
          include: { customer: { include: { user: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: { select: { bookings: true, reviews: true } },
      },
    });
    // Auto-fix image if missing
    if (provider?.user && !provider.user.image) {
      const correctImage = PROVIDER_IMAGES[provider.user.email ?? ''];
      if (correctImage) {
        await prisma.user.update({ where: { id: provider.user.id }, data: { image: correctImage } });
        provider.user.image = correctImage;
      }
    }
    return NextResponse.json(provider);
  }

  const where: any = {};
  if (category) {
    where.categories = { some: { slug: category } };
  }
  if (verified === 'true') {
    where.isVerified = true;
  }

  const providers = await prisma.providerProfile.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
        },
      },
      categories: true,
    },
    orderBy: { ratingAvg: 'desc' },
  });

  // Auto-fix any providers missing an image
  const fixPromises = providers
    .filter(p => p.user && !p.user.image && PROVIDER_IMAGES[p.user.email ?? ''])
    .map(p => prisma.user.update({
      where: { id: p.user!.id },
      data: { image: PROVIDER_IMAGES[p.user!.email!] },
    }));
  if (fixPromises.length > 0) await Promise.all(fixPromises);

  // Return with correct images applied
  const result = providers.map(p => ({
    ...p,
    user: p.user ? {
      name: p.user.name,
      image: p.user.image ?? PROVIDER_IMAGES[p.user.email ?? ''] ?? null,
    } : p.user,
  }));

  return NextResponse.json(result);
}
