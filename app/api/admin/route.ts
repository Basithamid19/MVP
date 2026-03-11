import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await auth();
  if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const pendingVerifications = await prisma.providerVerification.findMany({
    where: { status: 'PENDING' },
    include: { provider: { include: { user: true } } },
  });

  const stats = {
    totalRequests: await prisma.serviceRequest.count(),
    totalBookings: await prisma.booking.count(),
    completedBookings: await prisma.booking.count({ where: { status: 'COMPLETED' } }),
    totalProviders: await prisma.providerProfile.count(),
  };

  return NextResponse.json({ pendingVerifications, stats });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { verificationId, status, tier } = body;

  const verification = await prisma.providerVerification.update({
    where: { id: verificationId },
    data: { status },
  });

  if (status === 'APPROVED') {
    await prisma.providerProfile.update({
      where: { id: verification.providerProfileId },
      data: { 
        isVerified: true,
        verificationTier: tier || 'TIER1_ID_VERIFIED'
      },
    });
  }

  return NextResponse.json(verification);
}
