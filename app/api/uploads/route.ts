import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { uploadImage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

// Accepted image types + size cap (5 MB) for chat photos and verification docs.
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']);
const MAX_BYTES = 5 * 1024 * 1024;

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
  const realUrl = await uploadImage(
    Buffer.from(await file.arrayBuffer()),
    file.type,
    objectPath,
  );
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
