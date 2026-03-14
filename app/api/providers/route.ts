import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const category = searchParams.get('category');
  const verified = searchParams.get('verified');

  if (id) {
    try {
      const provider = await prisma.providerProfile.findFirst({
        where: { id },
        include: {
          user: true,
          categories: true,
          offerings: true,
          availability: true,
          reviews: {
            where: { isHidden: false },
            include: { customer: { include: { user: { select: { name: true, image: true } } } } },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      });
      if (!provider) {
        return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
      }
      return NextResponse.json(provider);
    } catch (err) {
      console.error('[/api/providers] single fetch error:', err);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

  const where: any = {};
  if (category) {
    where.categories = {
      some: {
        slug: category,
      },
    };
  }
  if (verified === 'true') {
    where.isVerified = true;
  }

  const providers = await prisma.providerProfile.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          image: true,
        },
      },
      categories: true,
    },
    orderBy: {
      ratingAvg: 'desc',
    },
  });

  return NextResponse.json(providers);
}
