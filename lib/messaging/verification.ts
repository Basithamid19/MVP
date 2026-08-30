// Issue-and-send for account verification. Shared by POST /api/auth/register
// and POST /api/auth/resend so both flows mint the same tokens with the same
// expiries. Never throws — a delivery failure returns false and the caller
// decides what to tell the user.

import { createAuthToken } from './tokens';
import { sendEmail } from './email';
import { sendSms } from './sms';
import { verificationEmail, verificationSms } from './templates';

export const EMAIL_TOKEN_TTL_MINUTES = 48 * 60; // link, 48h
export const PHONE_TOKEN_TTL_MINUTES = 10;      // 6-digit code, 10 min
export const RESET_TOKEN_TTL_MINUTES = 60;      // reset link, 1h

export function appOrigin(): string {
  return (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '');
}

export async function sendVerification(
  user: { id: string; email: string; phone?: string | null },
  channel: 'email' | 'sms',
): Promise<boolean> {
  if (channel === 'sms') {
    if (!user.phone) return false;
    const code = await createAuthToken(user.id, 'PHONE_VERIFY', PHONE_TOKEN_TTL_MINUTES);
    if (!code) return false;
    const { sent } = await sendSms({ to: user.phone, body: verificationSms(code) });
    return sent;
  }

  const token = await createAuthToken(user.id, 'EMAIL_VERIFY', EMAIL_TOKEN_TTL_MINUTES);
  if (!token) return false;
  const { subject, html } = verificationEmail(`${appOrigin()}/api/auth/verify?token=${token}`);
  const { sent } = await sendEmail({ to: user.email, subject, html });
  return sent;
}
