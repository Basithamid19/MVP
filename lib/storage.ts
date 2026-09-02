// Supabase Storage uploads via the Storage REST API (no SDK dependency).
//
// Extracted from app/api/uploads/route.ts so the avatar endpoint can share the
// exact same transport: avatars used to be persisted as base64 data URLs in
// User.image, which then shipped in every payload selecting that column.
//
// Env contract — all read at call time, never at module load, so a build
// without Supabase configured still imports cleanly:
//   SUPABASE_URL               required; missing → returns null
//   SUPABASE_SERVICE_ROLE_KEY  required; missing → returns null
//   SUPABASE_STORAGE_BUCKET    optional; defaults to 'uploads'
const DEFAULT_BUCKET = 'uploads';

/**
 * Uploads bytes to Supabase Storage and returns the public object URL.
 * Returns null when storage isn't configured or the upload failed (logged) —
 * callers decide whether to fall back or to surface the failure.
 */
export async function uploadImage(
  buffer: Buffer | Uint8Array,
  contentType: string,
  keyPrefix: string,
): Promise<string | null> {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return null;

  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? DEFAULT_BUCKET;
  const root = base.replace(/\/$/, '');
  const objectPath = keyPrefix.replace(/^\/+|\/+$/g, '');

  try {
    const res = await fetch(`${root}/storage/v1/object/${bucket}/${objectPath}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': contentType || 'application/octet-stream',
        'x-upsert': 'true',
        'cache-control': '3600',
      },
      // Uint8Array, not Buffer: fetch's BodyInit typing doesn't accept Node
      // Buffers, and a plain view over the same bytes costs nothing.
      body: new Uint8Array(buffer),
    });
    if (!res.ok) {
      console.error('[storage] Supabase upload failed:', res.status, await res.text().catch(() => ''));
      return null;
    }
    return `${root}/storage/v1/object/public/${bucket}/${objectPath}`;
  } catch (err) {
    console.error('[storage] Supabase upload error:', err);
    return null;
  }
}
