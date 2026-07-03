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

    // Direct requests are visible ONLY to their target provider; open
    // requests (targetProviderId null) broadcast to the whole category.
    // Falls back to the unfiltered query if the 20260706 migration hasn't run.
    const baseWhere = {
      ...categoryFilter,
      status: { in: ['NEW', 'QUOTED'] as any },
      quotes: { none: { providerId: profile.id } },
    };
    const LEAD_INCLUDE = {
      category: true,
      quotes: { select: { id: true } },
    } as const;
    const LEAD_ORDER = [
      { isUrgent: 'desc' as const },
      { createdAt: 'desc' as const },
    ];

    const requests = await prisma.serviceRequest.findMany({
      where: {
        ...baseWhere,
        OR: [{ targetProviderId: null }, { targetProviderId: profile.id }],
      },
      include: LEAD_INCLUDE,
      orderBy: LEAD_ORDER,
      take: 50,
    }).catch(async (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('targetProviderId') || msg.includes('column') || msg.includes('P2022')) {
        console.warn('[provider/leads GET] targetProviderId column missing, falling back');
        return prisma.serviceRequest.findMany({
          where: baseWhere,
          include: LEAD_INCLUDE,
          orderBy: LEAD_ORDER,
          take: 50,
        });
      }
      throw err;
    });

    return NextResponse.json(requests);
  } catch (err: unknown) {
    console.error('[provider/leads GET]', err);
    return NextResponse.json([]);
  }
}
