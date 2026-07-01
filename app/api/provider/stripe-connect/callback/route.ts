import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // NextResponse.redirect requires an ABSOLUTE URL — a relative '/login' throws
  // ERR_INVALID_URL (500). Resolve a base from NEXTAUTH_URL, falling back to the
  // request's own origin so the callback never crashes if the env is unset.
  const base = process.env.NEXTAUTH_URL ?? new URL(request.url).origin;

  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'PROVIDER') {
    return NextResponse.redirect(new URL('/login', base));
  }

  const userId = (session.user as any).id;
  const provider = await prisma.providerProfile.findUnique({ where: { userId } });

  if (provider?.stripeAccountId) {
    const account = await stripe.accounts.retrieve(provider.stripeAccountId);
    const onboarded = account.details_submitted && !account.requirements?.currently_due?.length;
    if (onboarded) {
      await prisma.providerProfile.update({
        where: { userId },
        data: { stripeOnboarded: true },
      });
    }
  }

  return NextResponse.redirect(new URL('/provider/earnings', base));
}
