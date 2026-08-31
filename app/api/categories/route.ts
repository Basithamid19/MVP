import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Deliberately NOT `force-dynamic` (mirrors app/api/providers/route.ts): the
// category list is fully public — no session, cookie or role read anywhere in
// this handler — so we want Vercel's edge cache to honor the Cache-Control
// header below instead of Next stamping `no-store` on every response.
export const dynamic = 'auto';

export async function GET() {
  const categories = await prisma.serviceCategory.findMany({
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(categories, {
    headers: {
      // Categories change on the order of months. 60s fresh at the edge, 5min
      // stale-while-revalidate keeps this off Postgres almost entirely.
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
