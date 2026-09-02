import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { providerThreadsByRequest } from '@/lib/chat-access';
import QuotesClient from './QuotesClient';

// Provider's sent quotes — RSC first paint, client polling still owns refresh
// via /api/quotes. Mirrors that route's select shape including the
// expiresAt (20260707) column fallback.
export const dynamic = 'force-dynamic';

const QUOTE_LIST_SELECT = {
  id: true, price: true, estimatedHours: true, notes: true,
  status: true, createdAt: true, expiresAt: true,
  booking: { select: { id: true } },
  request: {
    select: {
      id: true, description: true, address: true, dateWindow: true, status: true,
      category: { select: { name: true } },
    },
  },
} as const;

const QUOTE_LIST_SELECT_SAFE = {
  id: true, price: true, estimatedHours: true, notes: true,
  status: true, createdAt: true,
  booking: { select: { id: true } },
  request: {
    select: {
      id: true, description: true, address: true, dateWindow: true, status: true,
      category: { select: { name: true } },
    },
  },
} as const;

async function getInitialQuotes(providerUserId: string) {
  try {
    const provider = await prisma.providerProfile.findUnique({
      where: { userId: providerUserId },
      select: { id: true },
    });
    if (!provider) return [];

    const quotes = await prisma.quote.findMany({
      where: { providerId: provider.id },
      select: QUOTE_LIST_SELECT,
      orderBy: { createdAt: 'desc' },
      take: 100,
    }).catch(async (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('expiresAt') || msg.includes('column') || msg.includes('P2022')) {
        return prisma.quote.findMany({
          where: { providerId: provider.id },
          select: QUOTE_LIST_SELECT_SAFE,
          orderBy: { createdAt: 'desc' },
          take: 100,
        });
      }
      throw err;
    });

    // Batched thread lookup per API route. Empty map on un-migrated DB.
    const threadByRequest = await providerThreadsByRequest(
      quotes.map((q: any) => q.request?.id).filter(Boolean),
      providerUserId,
    );

    return JSON.parse(JSON.stringify(quotes.map((q: any) => ({
      ...q,
      threadId: q.request?.id ? threadByRequest.get(q.request.id) ?? null : null,
    }))));
  } catch (err) {
    console.warn('[provider/quotes] initial data fetch failed — client will retry:', err);
    return [];
  }
}

export default async function Page() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const role = (session.user as any).role;
  // PROVIDER-only. middleware.ts is the policy source: /provider/* admits
  // PROVIDER alone and bounces ADMIN to /admin/dashboard, so the old ADMIN
  // allowance here was unreachable and contradicted the gate.
  if (role !== 'PROVIDER') redirect('/dashboard');

  const initialQuotes = await getInitialQuotes((session.user as any).id);
  return <QuotesClient initialQuotes={initialQuotes} />;
}
