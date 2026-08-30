// Which verification channels this deployment can actually use. The register
// page reads this (via GET /api/auth/verification-channels) so it only offers
// choices that will really deliver, and registration falls back to
// auto-verification when neither channel is configured.

export function emailConfigured(): boolean {
  const provider = (process.env.EMAIL_PROVIDER || (process.env.RESEND_API_KEY ? 'resend' : '')).toLowerCase();
  return provider === 'resend' && !!process.env.RESEND_API_KEY;
}

export function smsConfigured(): boolean {
  const provider = (
    process.env.SMS_PROVIDER ||
    (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN ? 'twilio' : '')
  ).toLowerCase();
  return (
    provider === 'twilio' &&
    !!process.env.TWILIO_ACCOUNT_SID &&
    !!process.env.TWILIO_AUTH_TOKEN &&
    !!process.env.TWILIO_FROM
  );
}

export function availableChannels(): { email: boolean; sms: boolean } {
  return { email: emailConfigured(), sms: smsConfigured() };
}
