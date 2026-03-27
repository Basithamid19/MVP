import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { image } = await req.json();
  if (!image || typeof image !== 'string') {
    return NextResponse.json({ error: 'Invalid image' }, { status: 400 });
  }

  // Accept only base64 data URLs (jpeg/png/webp)
  if (!image.startsWith('data:image/')) {
    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  }

  await prisma.user.update({
    where: { email: session.user.email },
    data: { image },
  });

  return NextResponse.json({ ok: true, image });
}
