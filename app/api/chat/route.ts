import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('threadId');

    // If threadId provided, return messages for that thread
    if (threadId) {
      const messages = await prisma.chatMessage.findMany({
        where: { threadId },
        orderBy: { createdAt: 'asc' },
      });
      return NextResponse.json(messages);
    }

    // Otherwise, return all threads for the current user
    const userId = (session.user as any).id;

    // Match threads whether stored via scalar fields (post-migration) or participants join table (pre-migration)
    const threads = await prisma.chatThread.findMany({
      where: {
        OR: [
          { customerId: userId },
          { providerId: userId },
          { participants: { some: { id: userId } } },
        ],
      },
      include: {
        participants: {
          select: { id: true, name: true, image: true, role: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        request: {
          include: { category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Sort by last message date (threads with recent messages first)
    const sorted = threads.sort((a, b) => {
      const aDate = a.messages[0]?.createdAt ?? a.createdAt;
      const bDate = b.messages[0]?.createdAt ?? b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

    const result = sorted
      .map(t => ({
        id: t.id,
        otherParticipant: t.participants.find(p => p.id !== userId) ?? t.participants[0],
        lastMessage: t.messages[0] ?? null,
        category: t.request?.category?.name ?? 'Service',
        createdAt: t.createdAt,
      }));

    return NextResponse.json(result);
  } catch (err) {
    console.error('[chat] GET Error:', err);
    return NextResponse.json({ error: 'Failed to load threads' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { threadId, content } = body;

    if (!threadId || !content?.trim()) {
      return NextResponse.json({ error: 'threadId and content required' }, { status: 400 });
    }

    const message = await prisma.chatMessage.create({
      data: {
        threadId,
        senderId: (session.user as any).id,
        content: content.trim(),
      },
    });

    return NextResponse.json(message);
  } catch (err) {
    console.error('[chat] POST Error:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
