import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redactPII } from '@/lib/pii-filter';

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

    const threadInclude = {
      participants: {
        select: { id: true, name: true, image: true, role: true },
      },
      messages: {
        orderBy: { createdAt: 'desc' } as const,
        take: 1,
      },
      request: {
        include: { category: true },
      },
    };

    // Primary query: uses customerId/providerId scalar columns (added in migration
    // 20260403000000_add_chat_thread_dedup). Falls back to participants-only if the
    // migration hasn't been applied to the DB yet (Supabase pooler issue).
    const threads = await prisma.chatThread.findMany({
      where: {
        OR: [
          { customerId: userId },
          { providerId: userId },
          { participants: { some: { id: userId } } },
        ],
      },
      include: threadInclude,
      orderBy: { createdAt: 'desc' },
    }).catch(async (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('customerId') || msg.includes('providerId') ||
        msg.includes('column') || msg.includes('P2022')
      ) {
        console.warn('[chat GET] scalar columns missing, falling back to participants lookup');
        return prisma.chatThread.findMany({
          where: { participants: { some: { id: userId } } },
          include: threadInclude,
          orderBy: { createdAt: 'desc' },
        });
      }
      throw err;
    });

    // Sort by last message date (threads with recent messages first)
    const sorted = threads.sort((a, b) => {
      const aDate = a.messages[0]?.createdAt ?? a.createdAt;
      const bDate = b.messages[0]?.createdAt ?? b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

    const result = sorted
      .map(t => {
        const otherP = t.participants.find(p => p.id !== userId) ?? t.participants[0] ?? null;
        if (!otherP) return null;
        return {
          id: t.id,
          otherParticipant: otherP,
          lastMessage: t.messages[0] ?? null,
          category: t.request?.category?.name ?? 'Service',
          createdAt: t.createdAt,
        };
      })
      .filter(Boolean);

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

    // Check if thread is locked (deposit not yet paid)
    const thread = await prisma.chatThread.findUnique({
      where: { id: threadId },
      select: { isLocked: true },
    }).catch(() => null);

    if (thread?.isLocked) {
      return NextResponse.json({ error: 'Chat is locked. Pay the deposit to unlock messaging.', locked: true }, { status: 403 });
    }

    const message = await prisma.chatMessage.create({
      data: {
        threadId,
        senderId: (session.user as any).id,
        content: redactPII(content.trim()),
      },
    });

    return NextResponse.json(message);
  } catch (err) {
    console.error('[chat] POST Error:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
