import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import LeadsClient from './LeadsClient';

// Provider leads inbox — server-rendered on first visit so the list is on the
// page before the browser mounts. Mirrors app/api/provider/leads/route.ts,
// including the 20260706 targetProviderId column fallback ladder.
export const dynamic = 'force-dynamic';

const LEAD_INCLUDE = {
  category: true,
  quotes: { select: { id: true } },
} as const;
const LEAD_ORDER = [
  { isUrgent: 'desc' as const },
  { createdAt: 'desc' as const },
];

async function getInitialData(userId: string) {
  try {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      select: { id: true, categories: { select: { id: true } } },
    });

    if (!profile) {
      return { initialLeads: [], initialHasCategories: false };
    }

    const categoryIds = profile.categories.map(c => c.id);
    const hasCategories = categoryIds.length > 0;
    const categoryFilter = hasCategories ? { categoryId: { in: categoryIds } } : {};
    const baseWhere = {
      ...categoryFilter,
      status: { in: ['NEW', 'QUOTED'] as any },
      quotes: { none: { providerId: profile.id } },
    };

    const leads = await prisma.serviceRequest.findMany({
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
        console.warn('[provider/leads RSC] targetProviderId column missing, falling back');
        return prisma.serviceRequest.findMany({
          where: baseWhere,
          include: LEAD_INCLUDE,
          orderBy: LEAD_ORDER,
          take: 50,
        });
      }
      throw err;
    });

    return {
      initialLeads: JSON.parse(JSON.stringify(leads)),
      initialHasCategories: hasCategories,
    };
  } catch (err) {
    console.warn('[provider/leads] initial data fetch failed — client will retry:', err);
    return { initialLeads: [], initialHasCategories: true };
  }
}

export default async function Page() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const role = (session.user as any).role;
  if (role === 'CUSTOMER') redirect('/dashboard');

  const data = await getInitialData((session.user as any).id);
  return <LeadsClient {...data} />;
}
