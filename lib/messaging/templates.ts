// Transactional email bodies. Kept here so registration, resend and
// forgot-password all send the identical thing. Inline styles only, no
// external assets — mail clients strip <style> blocks and block remote images.
//
// These are English-only: they are rendered on the server, which has no access
// to the browser's `aladdin_locale` preference that drives lib/i18n.

const WRAPPER_OPEN = `<div style="margin:0;padding:32px 16px;background:#f6f6f4;font-family:Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e6e4df;border-radius:16px;padding:32px;">
    <div style="font-size:20px;font-weight:700;letter-spacing:-0.02em;margin-bottom:24px;">Aladdin</div>`;

const WRAPPER_CLOSE = `    <p style="font-size:12px;line-height:18px;color:#8a8880;margin:24px 0 0;">
      If you didn't request this, you can safely ignore this email.
    </p>
  </div>
</div>`;

function button(href: string, label: string): string {
  return `<p style="margin:0 0 24px;">
      <a href="${href}" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 24px;border-radius:12px;">${label}</a>
    </p>
    <p style="font-size:12px;line-height:18px;color:#8a8880;margin:0 0 8px;">Or paste this link into your browser:</p>
    <p style="font-size:12px;line-height:18px;color:#8a8880;margin:0;word-break:break-all;">${href}</p>`;
}

export function verificationEmail(link: string): { subject: string; html: string } {
  return {
    subject: 'Verify your Aladdin account',
    html: `${WRAPPER_OPEN}
    <h1 style="font-size:22px;line-height:30px;font-weight:700;margin:0 0 12px;">Confirm your email</h1>
    <p style="font-size:14px;line-height:22px;color:#4a4a46;margin:0 0 24px;">
      Tap the button below to verify your account and start using Aladdin. This link expires in 48 hours.
    </p>
    ${button(link, 'Verify my account')}
${WRAPPER_CLOSE}`,
  };
}

export function passwordResetEmail(link: string): { subject: string; html: string } {
  return {
    subject: 'Reset your Aladdin password',
    html: `${WRAPPER_OPEN}
    <h1 style="font-size:22px;line-height:30px;font-weight:700;margin:0 0 12px;">Reset your password</h1>
    <p style="font-size:14px;line-height:22px;color:#4a4a46;margin:0 0 24px;">
      Choose a new password using the button below. This link expires in 1 hour.
    </p>
    ${button(link, 'Set a new password')}
${WRAPPER_CLOSE}`,
  };
}

export function verificationSms(code: string): string {
  return `Your Aladdin verification code: ${code}`;
}
