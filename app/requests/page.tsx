import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import RequestsClient from './RequestsClient';

// Logged-in, per-user page — can't edge-cache. Server-render the initial
// requests so the HTML streams with content in place. Mirrors the API route's
// customer branch: same where + include shape.
export const dynamic = 'force-dynamic';

async function getInitialData(userId: string) {
  try {
    const requests = await prisma.serviceRequest.findMany({
      where: { customer: { userId } },
      include: { category: true, quotes: true },
      orderBy: { createdAt: 'desc' },
    });
    return { initialRequests: JSON.parse(JSON.stringify(requests)) };
  } catch (err) {
    console.warn('[requests] initial data fetch failed — client will retry:', err);
    return { initialRequests: [] };
  }
}

export default async function Page() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  // Customer-only surface: providers and admins each bounce to their own home.
  const role = (session.user as any).role;
  if (role === 'PROVIDER') redirect('/provider/dashboard');
  if (role === 'ADMIN') redirect('/admin/dashboard');

  const data = await getInitialData((session.user as any).id);
  return <RequestsClient {...data} />;
}
