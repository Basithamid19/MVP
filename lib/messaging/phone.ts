// Phone normalization to E.164, Lithuania-first (the marketplace is Vilnius).
// Accepts the three shapes users actually type — "+370 6XX XXXXX",
// "8 6XX XXXXX" (national trunk form), "6XX XXXXX" (bare mobile) — plus any
// other "+<country><digits>" international number. Returns null when the input
// can't be trusted, so callers can 400 instead of silently storing junk.

const LT_COUNTRY = '+370';

export function normalizePhone(raw: string): string | null {
  if (!raw) return null;

  // Strip everything humans use as separators; keep a leading +.
  const cleaned = String(raw).trim().replace(/[\s\-().]/g, '');
  if (!cleaned) return null;

  if (cleaned.startsWith('+')) {
    const digits = cleaned.slice(1);
    if (!/^\d{8,15}$/.test(digits)) return null;
    return `+${digits}`;
  }

  if (!/^\d+$/.test(cleaned)) return null;

  // 00 international prefix → +
  if (cleaned.startsWith('00')) {
    const digits = cleaned.slice(2);
    if (!/^\d{8,15}$/.test(digits)) return null;
    return `+${digits}`;
  }

  // 370XXXXXXXX typed without the +
  if (cleaned.startsWith('370') && cleaned.length === 11) {
    return `+${cleaned}`;
  }

  // National trunk form: 86XXXXXXX → +3706XXXXXXX
  if (cleaned.startsWith('8') && cleaned.length === 9) {
    return `${LT_COUNTRY}${cleaned.slice(1)}`;
  }

  // Bare LT mobile: 6XXXXXXX (8 digits) → +3706XXXXXXX
  if (cleaned.startsWith('6') && cleaned.length === 8) {
    return `${LT_COUNTRY}${cleaned}`;
  }

  return null;
}
