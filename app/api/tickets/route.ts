import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

// POST — file a support ticket / issue report. Lands in the AdminTicket table
// (already surfaced in the admin dashboard's tickets section). Previously the
// booking-page 'Report an issue' just alert()'d and threw the text away.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({} as any));
  const subject = typeof body.subject === 'string' ? body.subject.trim().slice(0, 200) : '';
  const description = typeof body.description === 'string' ? body.description.trim().slice(0, 5000) : '';

  if (!subject || !description) {
    return NextResponse.json({ error: 'Subject and description are required' }, { status: 400 });
  }

  const ticket = await prisma.adminTicket.create({
    data: {
      reporterId: (session.user as any).id,
      subject,
      description,
      status: 'OPEN',
    },
  });

  // Let admins know — non-fatal if notification fails.
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
  for (const admin of admins) {
    createNotification({
      userId: admin.id,
      type: 'status',
      title: 'New support ticket',
      body: subject,
      href: '/admin/dashboard',
    });
  }

  return NextResponse.json({ id: ticket.id, status: ticket.status });
}
