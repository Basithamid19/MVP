import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const threads = await prisma.chatThread.findMany({
    where: {
      participants: { some: { id: userId } },
    },
    include: {
      participants: {
        select: { id: true, name: true, image: true, role: true },
      },
      request: {
        select: { id: true, description: true, category: { select: { name: true } } },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { content: true, createdAt: true, senderId: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = threads.map(t => {
    const otherParticipant = t.participants.find(p => p.id !== userId);
    const lastMessage = t.messages[0] ?? null;
    return {
      id: t.id,
      otherUser: otherParticipant ?? { id: '', name: 'Unknown', image: null, role: 'CUSTOMER' },
      category: t.request?.category?.name ?? null,
      requestDescription: t.request?.description ?? null,
      lastMessage: lastMessage ? {
        content: lastMessage.content,
        createdAt: lastMessage.createdAt,
        isMe: lastMessage.senderId === userId,
      } : null,
      createdAt: t.createdAt,
    };
  });

  return NextResponse.json(formatted);
}
