import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'PROVIDER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const origin = request.headers.get('origin') ?? process.env.NEXTAUTH_URL ?? '';

  const provider = await prisma.providerProfile.findUnique({ where: { userId } });
  if (!provider) return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 });

  let accountId = provider.stripeAccountId;

  if (!accountId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'LT',
      email: user?.email,
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
    });
    accountId = account.id;
    await prisma.providerProfile.update({
      where: { userId },
      data: { stripeAccountId: accountId },
    });
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/api/provider/stripe-connect`,
    return_url: `${origin}/api/provider/stripe-connect/callback`,
    type: 'account_onboarding',
  });

  return NextResponse.json({ url: accountLink.url });
}
