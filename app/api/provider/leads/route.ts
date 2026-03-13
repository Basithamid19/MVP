import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await prisma.providerProfile.findUnique({
    where: { userId: (session.user as any).id },
    include: { categories: true },
  });

  if (!profile) return NextResponse.json([]);

  const categoryIds = profile.categories.map(c => c.id);

  // Requests in provider's categories that are still open (NEW or QUOTED)
  const requests = await prisma.serviceRequest.findMany({
    where: {
      categoryId: { in: categoryIds.length > 0 ? categoryIds : undefined },
      status: { in: ['NEW', 'QUOTED'] },
      // Exclude requests this provider already quoted
      quotes: { none: { providerId: profile.id } },
    },
    include: {
      category: true,
      quotes: { select: { id: true } },
    },
    orderBy: [
      { isUrgent: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 50,
  });

  return NextResponse.json(requests);
}
