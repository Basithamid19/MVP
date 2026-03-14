import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { providerId } = await request.json();

  if (!providerId) {
    return NextResponse.json({ error: 'providerId is required' }, { status: 400 });
  }

  const provider = await prisma.providerProfile.findUnique({
    where: { id: providerId },
    include: { user: true, categories: true },
  });

  if (!provider) {
    return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
  }

  const customer = await prisma.customerProfile.findUnique({
    where: { userId },
  });

  if (!customer) {
    return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
  }

  // Check if there's already an open chat between this customer and provider
  const existingThread = await prisma.chatThread.findFirst({
    where: {
      request: { customerId: customer.id },
      participants: { some: { id: provider.userId } },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existingThread) {
    return NextResponse.json({ threadId: existingThread.id });
  }

  // Create an inquiry service request + chat thread in a transaction
  const categoryId = provider.categories[0]?.id;
  if (!categoryId) {
    return NextResponse.json({ error: 'Provider has no service category' }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const serviceRequest = await tx.serviceRequest.create({
      data: {
        customerId: customer.id,
        categoryId,
        address: '',
        description: `Chat inquiry with ${provider.user.name}`,
        dateWindow: new Date(),
        status: 'CHATTING',
      },
    });

    const thread = await tx.chatThread.create({
      data: {
        requestId: serviceRequest.id,
        participants: {
          connect: [{ id: userId }, { id: provider.userId }],
        },
      },
    });

    return thread;
  });

  return NextResponse.json({ threadId: result.id });
}
