import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { hasConfirmedBookingBetween } from '@/lib/chat-access';

export const dynamic = 'force-dynamic';

// Helper: check if the new scalar fields exist in the DB
async function hasScalarFields(): Promise<boolean> {
  try {
    await prisma.chatThread.findFirst({
      where: { customerId: '__probe__' },
      select: { id: true },
    });
    return true;
  } catch {
    return false;
  }
}

// POST /api/chat/start — find or create a chat thread with a provider
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { providerId, requestId: suppliedRequestId } = body;

    if (!providerId) {
      return NextResponse.json({ error: 'providerId required' }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    // Find the provider's userId
    const provider = await prisma.providerProfile.findUnique({
      where: { id: providerId },
      select: { userId: true },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    if (provider.userId === userId) {
      return NextResponse.json({ error: 'Cannot chat with yourself' }, { status: 400 });
    }

    // Determine customer and provider user IDs
    const customerId = userRole === 'PROVIDER' ? provider.userId : userId;
    const providerUserId = userRole === 'PROVIDER' ? userId : provider.userId;

    // Chat gate: conversations can only be started once a booking between the
    // pair is confirmed (deposit paid). Admin exempt for moderation flows.
    if (userRole !== 'ADMIN') {
      const confirmed = await hasConfirmedBookingBetween([customerId, providerUserId]);
      if (!confirmed) {
        return NextResponse.json(
          { error: 'Messaging unlocks once a booking is confirmed (deposit paid).', locked: true },
          { status: 403 },
        );
      }
    }

    // One conversation per customer↔provider pair: if ANY thread already
    // exists between these two people, continue it — never spawn a new one
    // keyed to whatever the customer's latest request happens to be. Prefer
    // the thread that already has messages, then most recent activity.
    type PairThread = { id: string; createdAt: Date; messages: { createdAt: Date }[] };
    const PAIR_SELECT = {
      id: true,
      createdAt: true,
      messages: { orderBy: { createdAt: 'desc' as const }, take: 1, select: { createdAt: true } },
    } as const;

    const pairThreads: PairThread[] = await prisma.chatThread.findMany({
      where: { customerId, providerId: providerUserId },
      select: PAIR_SELECT,
    }).catch(async (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('customerId') || msg.includes('providerId') || msg.includes('column') || msg.includes('P2022')) {
        // Scalar columns missing (20260403 migration not applied) — fall back
        // to the participants relation.
        return prisma.chatThread.findMany({
          where: {
            AND: [
              { participants: { some: { id: customerId } } },
              { participants: { some: { id: providerUserId } } },
            ],
          },
          select: PAIR_SELECT,
        }).catch(() => []);
      }
      return [];
    });

    if (pairThreads.length > 0) {
      const best = [...pairThreads].sort((a, b) => {
        const aHas = a.messages.length > 0;
        const bHas = b.messages.length > 0;
        if (aHas !== bHas) return aHas ? -1 : 1;
        const aDate = a.messages[0]?.createdAt ?? a.createdAt;
        const bDate = b.messages[0]?.createdAt ?? b.createdAt;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      })[0];
      return NextResponse.json({ threadId: best.id });
    }

    // Resolve requestId
    let requestId = suppliedRequestId || null;

    if (!requestId) {
      const customerProfile = await prisma.customerProfile.findUnique({
        where: { userId: customerId },
        select: { id: true },
      });

      if (customerProfile) {
        const quoteLink = await prisma.quote.findFirst({
          where: {
            providerId,
            request: { customerId: customerProfile.id },
          },
          select: { requestId: true },
          orderBy: { createdAt: 'desc' },
        });
        requestId = quoteLink?.requestId ?? null;

        if (!requestId) {
          const latestReq = await prisma.serviceRequest.findFirst({
            where: { customerId: customerProfile.id },
            select: { id: true },
            orderBy: { createdAt: 'desc' },
          });
          requestId = latestReq?.id ?? null;
        }
      }
    }

    if (!requestId) {
      return NextResponse.json(
        { error: 'No service request found. Please submit a service request first.' },
        { status: 400 }
      );
    }

    const useScalar = await hasScalarFields();

    // --- Find existing thread ---
    let existingThread;
    if (useScalar) {
      existingThread = await prisma.chatThread.findFirst({
        where: { requestId, customerId, providerId: providerUserId },
      });
    } else {
      // Fallback: old participants-based lookup
      existingThread = await prisma.chatThread.findFirst({
        where: {
          requestId,
          AND: [
            { participants: { some: { id: customerId } } },
            { participants: { some: { id: providerUserId } } },
          ],
        },
      });
    }

    if (existingThread) {
      return NextResponse.json({ threadId: existingThread.id });
    }

    // --- Create thread ---
    try {
      const createData: any = {
        requestId,
        participants: {
          connect: [{ id: customerId }, { id: providerUserId }],
        },
      };
      if (useScalar) {
        createData.customerId = customerId;
        createData.providerId = providerUserId;
      }
      const thread = await prisma.chatThread.create({ data: createData });
      return NextResponse.json({ threadId: thread.id });
    } catch (err: any) {
      // Unique constraint violation — thread was created by a concurrent request
      if (err?.code === 'P2002') {
        const thread = useScalar
          ? await prisma.chatThread.findFirst({
              where: { requestId, customerId, providerId: providerUserId },
            })
          : await prisma.chatThread.findFirst({
              where: {
                requestId,
                AND: [
                  { participants: { some: { id: customerId } } },
                  { participants: { some: { id: providerUserId } } },
                ],
              },
            });
        if (thread) {
          return NextResponse.json({ threadId: thread.id });
        }
      }
      throw err;
    }
  } catch (err) {
    console.error('[chat/start] Error:', err);
    return NextResponse.json(
      { error: 'Failed to start chat. Please try again.' },
      { status: 500 }
    );
  }
}
