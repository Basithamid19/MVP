// User.image may hold a legacy base64 data URL (20-60KB). Never ship those in
// a payload — the UI falls back to avatarUrl(name) (components/ui/avatar.tsx).
// Mirrors safeImageForToken in lib/auth.ts, which guards the JWT cookie.
//
// Those data URLs were written by the old POST /api/user/avatar, which stored
// whatever `data:image/...` blob the client canvas produced straight into the
// column. It is selected by nearly every hot payload (browse, bookings,
// requests, chat inbox, admin), so a handful of rows turned list responses into
// megabytes on mobile. Avatars now live in Supabase Storage as short public
// URLs; this is the read-side guard for rows written before that change and for
// any DB that hasn't run 20260903000000_purge_datauri_avatars yet.
export function publicImage(img: unknown): string | null {
  if (typeof img !== 'string' || img.length === 0) return null;
  if (img.length > 500) return null;
  if (!/^https?:\/\//.test(img)) return null;
  return img;
}

// Deep variant for the `include`-based payloads (admin sections, booking and
// request detail) where User rows sit several relations down and hand-mapping
// every nesting level would be both verbose and easy to get wrong on the next
// schema change. `image` is the ONLY field named `image` in the schema
// (ChatMessage uses `imageUrl`), so keying on the property name is unambiguous.
//
// Only arrays and plain objects are walked: Date / Prisma Decimal / Buffer
// values are returned by reference so JSON serialization is unchanged.
export function withPublicImages<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => withPublicImages(v)) as unknown as T;
  }
  if (!isPlainObject(value)) return value;

  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    out[key] = key === 'image' ? publicImage(v) : withPublicImages(v);
  }
  return out as T;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
