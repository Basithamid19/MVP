import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

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
  });

  return NextResponse.json(serviceRequest);
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const requests = await prisma.serviceRequest.findMany({
      where: {
        categoryId: { in: provider.categories.map(c => c.id) },
        status: 'NEW',
      },
      include: { category: true, customer: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(requests);
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
