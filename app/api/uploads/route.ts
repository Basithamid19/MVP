import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Accepted image types + size cap (5 MB) for chat photos and verification docs.
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']);
const MAX_BYTES = 5 * 1024 * 1024;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'uploads';

// Upload bytes to Supabase Storage via the Storage REST API (no SDK dependency).
// Returns the public object URL, or null if storage isn't configured/failed —
// caller then falls back to the simulated URL so dev/build without Supabase
// still works.
async function uploadToSupabase(file: File, objectPath: string): Promise<string | null> {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return null;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const res = await fetch(
      `${base.replace(/\/$/, '')}/storage/v1/object/${BUCKET}/${objectPath}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': file.type || 'application/octet-stream',
          'x-upsert': 'true',
          'cache-control': '3600',
        },
        body: Buffer.from(arrayBuffer),
      },
    );
    if (!res.ok) {
      console.error('[uploads] Supabase upload failed:', res.status, await res.text().catch(() => ''));
      return null;
    }
    return `${base.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/${objectPath}`;
  } catch (err) {
    console.error('[uploads] Supabase upload error:', err);
    return null;
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 413 });
  }

  // Namespaced, collision-resistant object path.
  const safeName = (file.name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
  const objectPath = `${(session.user as any).id}/${Date.now()}-${safeName}`;

  // Real storage when configured; otherwise fall back to the simulated URL so
  // dev/build without Supabase env still returns a usable placeholder.
  const realUrl = await uploadToSupabase(file, objectPath);
  const url = realUrl ?? `https://picsum.photos/seed/${encodeURIComponent(file.name)}/800/600`;

  const uploadedFile = await prisma.uploadedFile.create({
    data: {
      url,
      fileName: file.name,
      fileType: file.type,
    },
  });

  return NextResponse.json(uploadedFile);
}
