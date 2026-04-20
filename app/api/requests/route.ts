import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { categoryId, address, description, dateWindow, budget, isUrgent } = body;

  const customer = await prisma.customerProfile.findUnique({
    where: { userId: (session.user as any).id },
  });

  if (!customer) {
    return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
  }

  const serviceRequest = await prisma.serviceRequest.create({
    data: {
      customerId: customer.id,
      categoryId,
      address,
      description,
      dateWindow: new Date(dateWindow),
      budget: budget ? parseFloat(budget) : null,
      isUrgent: isUrgent || false,
      status: 'NEW',
    },
    include: { category: true },
  });

  // Notify all providers who have this category in their profile
  const matchingProviders = await prisma.providerProfile.findMany({
    where: { categories: { some: { id: categoryId } } },
    select: { userId: true },
  });

  const categoryName = serviceRequest.category?.name ?? 'service';
  const urgentPrefix = isUrgent ? '🔴 Urgent: ' : '';
  for (const provider of matchingProviders) {
    createNotification({
      userId: provider.userId,
      type: 'lead',
      title: `${urgentPrefix}New ${categoryName} lead`,
      body: `A customer needs ${categoryName.toLowerCase()} help${address ? ` in ${address}` : ''}. Send a quote now.`,
      href: '/provider/leads',
    });
  }

  return NextResponse.json(serviceRequest);
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    // Authorization: full details are only readable by the owning customer,
    // an admin, or a provider who has already submitted a quote on this
    // request. Category-matched providers who have NOT quoted yet are NOT
    // authorized here — lead visibility with a narrower field set will be
    // handled in a dedicated endpoint in a later block.
    const header = await prisma.serviceRequest.findUnique({
      where: { id },
      select: {
        id: true,
        customer: { select: { userId: true } },
      },
    });
    if (!header) {
      return NextResponse.json(null);
    }

    let authorized = role === 'ADMIN' || header.customer?.userId === userId;

    if (!authorized && role === 'PROVIDER') {
      const providerProfile = await prisma.providerProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (providerProfile) {
        const quoted = await prisma.quote.findFirst({
          where: { requestId: id, providerId: providerProfile.id },
          select: { id: true },
        });
        if (quoted) authorized = true;
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const req = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        category: true,
        customer: { include: { user: true } },
        quotes: {
          include: {
            provider: { include: { user: true, categories: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    return NextResponse.json(req);
  }

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  if (role === 'CUSTOMER') {
    const customer = await prisma.customerProfile.findUnique({
      where: { userId },
    });
    if (!customer) return NextResponse.json([]);
    
    const requests = await prisma.serviceRequest.findMany({
      where: { customerId: customer.id },
      include: { category: true, quotes: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(requests);
  } else if (role === 'PROVIDER') {
    const provider = await prisma.providerProfile.findUnique({
      where: { userId },
      include: { categories: true },
    });
    if (!provider) return NextResponse.json([]);

    const categoryIds = provider.categories.map(c => c.id);
    const categoryFilter = categoryIds.length > 0
      ? { categoryId: { in: categoryIds } }
      : {};

    const requests = await prisma.serviceRequest.findMany({
      where: {
        ...categoryFilter,
        status: { in: ['NEW', 'QUOTED'] },
      },
      include: { category: true, customer: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(requests);
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
