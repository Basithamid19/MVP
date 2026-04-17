import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'PROVIDER') {
    return NextResponse.redirect('/login');
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

  return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/provider/earnings`);
}
