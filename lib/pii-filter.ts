const PHONE_INTL = /\+\d[\d\s\-().]{7,}/g;
const PHONE_LOCAL = /\b\d{8,}\b/g;
const EMAIL = /[\w.+\-]+@[\w.\-]+\.\w{2,}/gi;
const PLATFORM_NAMES = /\b(whatsapp|telegram|signal|viber|imessage|wechat|snapchat)\b/gi;

export function redactPII(text: string): string {
  return text
    .replace(PHONE_INTL, '[phone redacted]')
    .replace(PHONE_LOCAL, '[phone redacted]')
    .replace(EMAIL, '[email redacted]')
    .replace(PLATFORM_NAMES, '[contact app redacted]');
}
