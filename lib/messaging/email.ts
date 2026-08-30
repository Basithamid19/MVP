// Transactional email over plain REST — no SDK dependency, matching the
// Supabase Storage approach in app/api/uploads/route.ts. Never throws: an
// unconfigured or failing provider must degrade (return { sent: false }), not
// break registration or password reset.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export const DEFAULT_EMAIL_FROM = 'Aladdin <no-reply@example.com>';

export interface SendResult {
  sent: boolean;
  error?: string;
}

function provider(): string {
  // Default to resend when a key is present so setting RESEND_API_KEY alone is
  // enough to turn email on.
  return (process.env.EMAIL_PROVIDER || (process.env.RESEND_API_KEY ? 'resend' : '')).toLowerCase();
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || DEFAULT_EMAIL_FROM;

  if (provider() !== 'resend' || !key) {
    console.warn('[email] not configured — skipping send to', to);
    return { sent: false, error: 'email_not_configured' };
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('[email] send failed:', res.status, detail);
      return { sent: false, error: `email_send_failed_${res.status}` };
    }

    return { sent: true };
  } catch (err) {
    console.error('[email] send error:', err);
    return { sent: false, error: 'email_send_error' };
  }
}
