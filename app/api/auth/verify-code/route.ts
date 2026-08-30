import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { consumeAuthToken } from '@/lib/messaging/tokens';

export const dynamic = 'force-dynamic';

// POST { email, code } — the SMS path. Public (the code is the credential),
// so every failure returns the same generic message: no hints about whether
// the email exists, the code expired, or it was simply wrong.
export async function POST(request: Request) {
  const INVALID = NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });

  try {
    const body = await request.json();
    const email = String(body?.email ?? '').trim().toLowerCase();
    const code = String(body?.code ?? '').trim();

    if (!email || !/^\d{6}$/.test(code)) return INVALID;

    const user = await prisma.user
      .findUnique({ where: { email }, select: { id: true, verifiedAt: true } })
      .catch(() => null);
    if (!user) return INVALID;

    // Codes are only 6 digits and `token` is globally unique, so the code must
    // be tied back to this user before it is burned.
    const match = await prisma.authToken
      .findFirst({
        where: { userId: user.id, type: 'PHONE_VERIFY', token: code, expiresAt: { gt: new Date() } },
        select: { token: true },
      })
      .catch(() => null);
    if (!match) return INVALID;

    const consumedUserId = await consumeAuthToken(match.token, 'PHONE_VERIFY');
    if (consumedUserId !== user.id) return INVALID;

    await prisma.user.update({ where: { id: user.id }, data: { verifiedAt: new Date() } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[verify-code] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
