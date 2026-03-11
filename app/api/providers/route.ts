import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const verified = searchParams.get('verified');

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
