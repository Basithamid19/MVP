import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/chat/start — find or create a chat thread with a provider
export async function POST(request: Request) {
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

  // Note: customerId here is the User.id of the customer (not CustomerProfile.id)
  // providerId from body is the ProviderProfile.id — we need the User.id for the thread

  // Resolve requestId
  let requestId = suppliedRequestId || null;

  if (!requestId) {
    // Find the most relevant request between this customer and provider
    const customerProfile = await prisma.customerProfile.findUnique({
      where: { userId: customerId },
      select: { id: true },
    });

    if (customerProfile) {
      // Find a request where this provider has quoted
      const quoteLink = await prisma.quote.findFirst({
        where: {
          providerId,
          request: { customerId: customerProfile.id },
        },
        select: { requestId: true },
        orderBy: { createdAt: 'desc' },
      });
      requestId = quoteLink?.requestId ?? null;

      // Fallback: customer's most recent request
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

  // Find existing thread using the unique constraint fields
  const existingThread = await prisma.chatThread.findFirst({
    where: {
      requestId,
      customerId,
      providerId: providerUserId,
    },
  });

  if (existingThread) {
    return NextResponse.json({ threadId: existingThread.id });
  }

  // Create thread with race-condition protection via unique constraint
  try {
    const thread = await prisma.chatThread.create({
      data: {
        requestId,
        customerId,
        providerId: providerUserId,
        participants: {
          connect: [{ id: customerId }, { id: providerUserId }],
        },
      },
    });
    return NextResponse.json({ threadId: thread.id });
  } catch (err: any) {
    // Unique constraint violation — thread was created by a concurrent request
    if (err?.code === 'P2002') {
      const thread = await prisma.chatThread.findFirst({
        where: { requestId, customerId, providerId: providerUserId },
      });
      return NextResponse.json({ threadId: thread!.id });
    }
    throw err;
  }
}
