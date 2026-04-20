import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET — list notifications for current user
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json(notifications);
}

// POST — create a notification for the current user only.
// Any `userId` provided in the request body is ignored; the row is always
// attributed to the session user. Server-side fan-out to other users must go
// through `lib/notifications.ts#createNotification` instead of this endpoint.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { type, title, body: notifBody, href } = body;
  const userId = (session.user as any).id;

  const notification = await prisma.notification.create({
    data: { userId, type, title, body: notifBody, href },
  });

  return NextResponse.json(notification);
}

// PATCH — mark notifications as read
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await request.json();
  const { ids, markAllRead } = body;

  if (markAllRead) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  } else if (ids?.length) {
    await prisma.notification.updateMany({
      where: { id: { in: ids }, userId },
      data: { isRead: true },
    });
  }

  return NextResponse.json({ success: true });
}
