import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { consumeAuthToken } from '@/lib/messaging/tokens';

export const dynamic = 'force-dynamic';

// GET — the email verification link. Consumes the token, marks the account
// verified and bounces to the login page, which renders the banner keyed off
// ?verified=1 / ?verified=0. Public by design: the token IS the credential.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token') ?? '';

  const userId = await consumeAuthToken(token, 'EMAIL_VERIFY');
  if (!userId) {
    return NextResponse.redirect(new URL('/login?verified=0', request.url));
  }

  const updated = await prisma.user
    .update({ where: { id: userId }, data: { verifiedAt: new Date() } })
    .catch((err: unknown) => {
      console.error('[verify] could not mark user verified:', err);
      return null;
    });

  return NextResponse.redirect(new URL(updated ? '/login?verified=1' : '/login?verified=0', request.url));
}
