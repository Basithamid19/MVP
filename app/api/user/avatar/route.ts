import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { uploadImage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

// Clients still POST `{ image: '<data:image/jpeg;base64,…>' }` — the canvas in
// app/account/AccountClient.tsx and app/provider/settings/page.tsx produces a
// data URL and that contract is unchanged. What changed is what we PERSIST:
// the data URL used to be written verbatim into User.image, so a 20-60KB blob
// shipped inside every payload selecting that column (browse, bookings, chat
// inbox, admin…). We now decode it, push the bytes to Supabase Storage and
// store only the short public URL. If storage is unavailable we fail loudly
// (503) rather than fall back to storing a data URL again.
const DATA_URL_RE = /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=\s]+)$/;

// Decoded-bytes cap. The clients downscale to a 300x300 JPEG (~20-60KB), so
// 3MB is generous headroom for anything hand-crafted but still bounded.
const MAX_DECODED_BYTES = 3 * 1024 * 1024;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: 'Session missing user ID — please log out and log back in.' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { image } = body ?? {};
  if (!image || typeof image !== 'string') {
    return NextResponse.json({ error: 'Invalid image' }, { status: 400 });
  }

  // Cheap length gate before the regex so an oversized body is rejected
  // without scanning it. base64 inflates by ~4/3, plus the header.
  if (image.length > MAX_DECODED_BYTES * 1.4 + 128) {
    return NextResponse.json({ error: 'Image too large (max 3MB)' }, { status: 413 });
  }

  // Accept only base64 data URLs (jpeg/png/webp)
  const match = DATA_URL_RE.exec(image);
  if (!match) {
    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  }

  const subtype = match[1] === 'jpg' ? 'jpeg' : match[1];
  const contentType = `image/${subtype}`;
  const ext = subtype === 'jpeg' ? 'jpg' : subtype;

  let buf: Buffer;
  try {
    buf = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  } catch {
    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  }
  if (buf.length === 0) {
    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  }
  if (buf.length > MAX_DECODED_BYTES) {
    return NextResponse.json({ error: 'Image too large (max 3MB)' }, { status: 413 });
  }

  const url = await uploadImage(buf, contentType, `avatars/${userId}/${Date.now()}.${ext}`);
  if (!url) {
    // Storage unconfigured or the PUT failed. Store NOTHING — persisting the
    // data URL is the exact regression this route exists to undo. 503 tells the
    // client this is transient/server-side, which is how both settings screens
    // pick their "photo storage unavailable" copy.
    return NextResponse.json(
      { error: 'Photo storage is unavailable right now. Please try again later.' },
      { status: 503 },
    );
  }

  try {
    // Write by `id`, not `email` — the jwt `trigger: 'update'` callback
    // reads fresh user data by id, so write and refresh must target the
    // same key to guarantee read-your-writes.
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { image: url },
      select: { id: true, image: true },
    });
    return NextResponse.json({ ok: true, image: updated.image });
  } catch (err) {
    console.error('[api/user/avatar] update failed:', err);
    return NextResponse.json({ error: 'Could not save photo. Please try again.' }, { status: 500 });
  }
}
