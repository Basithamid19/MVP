import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

// GET — fetch verification status for current provider
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const provider = await prisma.providerProfile.findUnique({
    where: { userId: (session.user as any).id },
    include: { verifications: { orderBy: { createdAt: 'desc' } } },
  });

  if (!provider) return NextResponse.json({ error: 'No provider profile' }, { status: 404 });

  return NextResponse.json({
    isVerified: provider.isVerified,
    verificationTier: provider.verificationTier,
    documents: provider.verifications,
  });
}

// POST — submit verification documents
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'PROVIDER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { documents, identity, businessType } = body;
  // documents: [{ docType: 'ID' | 'CERTIFICATE' | 'INSURANCE' | 'SELFIE', docUrl: string }]

  let provider = await prisma.providerProfile.findUnique({
    where: { userId: (session.user as any).id },
  });

  // Auto-create the provider profile if it doesn't exist yet
  // (provider signed up and went straight to onboarding without editing profile first)
  if (!provider) {
    provider = await prisma.providerProfile.create({
      data: {
        userId: (session.user as any).id,
        bio: '',
        serviceArea: 'Vilnius',
        languages: ['Lithuanian'],
      },
    });
  }

  // Create verification records for each document
  const created = [];
  for (const doc of documents) {
    const verification = await prisma.providerVerification.create({
      data: {
        providerProfileId: provider.id,
        docType: doc.docType,
        docUrl: doc.docUrl,
        status: 'PENDING',
      },
    });
    created.push(verification);
  }

  // Update provider profile with phone if provided
  if (identity?.phone) {
    await prisma.providerProfile.update({
      where: { id: provider.id },
      data: {
        bio: provider.bio || `${businessType === 'company' ? (identity.companyName ?? '') + ' · ' : ''}Verified professional`,
      },
    });
  }

  // Notify admins about new verification submission
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
  for (const admin of admins) {
    createNotification({
      userId: admin.id,
      type: 'status',
      title: 'New verification submission',
      body: `A provider has submitted ${created.length} document(s) for verification review.`,
      href: '/admin/dashboard',
    });
  }

  return NextResponse.json({ documents: created });
}
