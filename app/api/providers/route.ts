import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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
    return NextResponse.json(provider);
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
