// Transactional SMS over plain REST — no SDK dependency. Same contract as
// lib/messaging/email.ts: never throws, returns { sent: false } when the
// provider is unset or the call fails.

import type { SendResult } from './email';

function provider(): string {
  return (
    process.env.SMS_PROVIDER ||
    (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN ? 'twilio' : '')
  ).toLowerCase();
}

export async function sendSms({ to, body }: { to: string; body: string }): Promise<SendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;

  if (provider() !== 'twilio' || !sid || !token || !from) {
    console.warn('[sms] not configured — skipping send to', to);
    return { sent: false, error: 'sms_not_configured' };
  }

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('[sms] send failed:', res.status, detail);
      return { sent: false, error: `sms_send_failed_${res.status}` };
    }

    return { sent: true };
  } catch (err) {
    console.error('[sms] send error:', err);
    return { sent: false, error: 'sms_send_error' };
  }
}
