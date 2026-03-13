import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await prisma.providerProfile.findUnique({
    where: { userId: (session.user as any).id },
    include: { availability: true },
  });

  return NextResponse.json(profile?.availability ?? []);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await prisma.providerProfile.findUnique({
    where: { userId: (session.user as any).id },
  });
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const { slots } = await request.json();

  await prisma.availabilitySlot.deleteMany({ where: { providerProfileId: profile.id } });

  const created = await prisma.availabilitySlot.createMany({
    data: slots.map((s: any) => ({
      providerProfileId: profile.id,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
    })),
  });

  return NextResponse.json({ count: created.count });
}
