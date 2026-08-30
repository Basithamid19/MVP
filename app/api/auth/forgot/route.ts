import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { emailConfigured } from '@/lib/messaging/channels';
import { canSend, createAuthToken } from '@/lib/messaging/tokens';
import { sendEmail } from '@/lib/messaging/email';
import { passwordResetEmail } from '@/lib/messaging/templates';
import { appOrigin, RESET_TOKEN_TTL_MINUTES } from '@/lib/messaging/verification';

export const dynamic = 'force-dynamic';

// POST { email } — start a password reset. Always 200, whatever happens, so
// the response can't be used to discover which emails have accounts.
export async function POST(request: Request) {
  const OK = NextResponse.json({ ok: true });

  try {
    const body = await request.json();
    const email = String(body?.email ?? '').trim().toLowerCase();
    if (!email) return OK;

    if (!emailConfigured()) {
      console.warn('[forgot] email not configured — cannot send reset link');
      return OK;
    }

    const user = await prisma.user
      .findUnique({ where: { email }, select: { id: true, email: true } })
      .catch(() => null);
    if (!user) return OK;

    if (!(await canSend(user.id, ['PASSWORD_RESET']))) {
      console.warn('[forgot] throttled reset request for', email);
      return OK;
    }

    const token = await createAuthToken(user.id, 'PASSWORD_RESET', RESET_TOKEN_TTL_MINUTES);
    if (!token) return OK;

    const { subject, html } = passwordResetEmail(`${appOrigin()}/reset-password?token=${token}`);
    await sendEmail({ to: user.email, subject, html });

    return OK;
  } catch (error) {
    console.error('[forgot] error:', error);
    return OK;
  }
}
