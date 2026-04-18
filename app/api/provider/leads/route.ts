import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId: (session.user as any).id },
      select: { id: true, categories: true },
    });

    if (!profile) return NextResponse.json([]);

    const categoryIds = profile.categories.map(c => c.id);

    // If no categories set, show all open leads so the provider can see
    // available work and is encouraged to configure their profile.
    const categoryFilter = categoryIds.length > 0
      ? { categoryId: { in: categoryIds } }
      : {};

    const requests = await prisma.serviceRequest.findMany({
      where: {
        ...categoryFilter,
        status: { in: ['NEW', 'QUOTED'] },
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
  } catch (err: unknown) {
    console.error('[provider/leads GET]', err);
    return NextResponse.json([]);
  }
}
