import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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

  // Accept only base64 data URLs (jpeg/png/webp)
  if (!image.startsWith('data:image/')) {
    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  }

  try {
    // Write by `id`, not `email` — the jwt `trigger: 'update'` callback
    // reads fresh user data by id, so write and refresh must target the
    // same key to guarantee read-your-writes.
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { image },
      select: { id: true, image: true },
    });
    return NextResponse.json({ ok: true, image: updated.image });
  } catch (err) {
    console.error('[api/user/avatar] update failed:', err);
    return NextResponse.json({ error: 'Could not save photo. Please try again.' }, { status: 500 });
  }
}
