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

  const { providerId } = await request.json();
  if (!providerId) {
    return NextResponse.json({ error: 'providerId required' }, { status: 400 });
  }

  const userId = (session.user as any).id;

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

  // Find existing thread between these two users
  const existingThread = await prisma.chatThread.findFirst({
    where: {
      AND: [
        { participants: { some: { id: userId } } },
        { participants: { some: { id: provider.userId } } },
      ],
    },
  });

  if (existingThread) {
    return NextResponse.json({ threadId: existingThread.id });
  }

  // No existing thread — we need a requestId to create one.
  // Find any service request between them, or the most recent request by the customer.
  const customerProfile = await prisma.customerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  let requestId: string | null = null;

  if (customerProfile) {
    // Find a request that has a quote from this provider
    const quoteLink = await prisma.quote.findFirst({
      where: {
        providerId: providerId,
        request: { customerId: customerProfile.id },
      },
      select: { requestId: true },
      orderBy: { createdAt: 'desc' },
    });
    requestId = quoteLink?.requestId ?? null;

    // Fallback: use the customer's most recent request
    if (!requestId) {
      const latestReq = await prisma.serviceRequest.findFirst({
        where: { customerId: customerProfile.id },
        select: { id: true },
        orderBy: { createdAt: 'desc' },
      });
      requestId = latestReq?.id ?? null;
    }
  }

  if (!requestId) {
    // Provider starting the chat — find any request they quoted on
    const provQuote = await prisma.quote.findFirst({
      where: { providerId },
      select: { requestId: true },
      orderBy: { createdAt: 'desc' },
    });
    requestId = provQuote?.requestId ?? null;
  }

  if (!requestId) {
    return NextResponse.json(
      { error: 'No service request found. Please submit a service request first.' },
      { status: 400 }
    );
  }

  // Create the thread
  const thread = await prisma.chatThread.create({
    data: {
      requestId,
      participants: {
        connect: [{ id: userId }, { id: provider.userId }],
      },
    },
  });

  return NextResponse.json({ threadId: thread.id });
}
