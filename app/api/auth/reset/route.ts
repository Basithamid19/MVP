import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { consumeAuthToken } from '@/lib/messaging/tokens';

export const dynamic = 'force-dynamic';

const MIN_PASSWORD_LENGTH = 8;

// POST { token, password } — finish a password reset. The token is the
// credential, so it is burned on use and a used/expired one is indistinguishable
// from a forged one in the response.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = String(body?.token ?? '').trim();
    const password = String(body?.password ?? '');

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
        { status: 400 },
      );
    }

    const userId = await consumeAuthToken(token, 'PASSWORD_RESET');
    if (!userId) {
      return NextResponse.json({ error: 'This link is invalid or has expired' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Completing a reset proves control of the mailbox, so an account that was
    // still pending email verification becomes verified here too.
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, verifiedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[reset] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
