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
  // identity: { fullName, phone, companyName, vatNumber }
  // Note: raw national ID number is intentionally NOT persisted — it lives only
  // in the uploaded verification document, never as a plaintext column.

  if (!Array.isArray(documents)) {
    return NextResponse.json({ error: 'documents array required' }, { status: 400 });
  }

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

  // Persist business identity from onboarding. companyName/businessType/
  // vatNumber are new columns (20260703) — guard with a P2022 fallback that
  // still writes the bio seed if the columns aren't there yet.
  const profileUpdate: Record<string, unknown> = {};
  if (identity?.companyName) profileUpdate.companyName = String(identity.companyName).trim();
  if (identity?.vatNumber) profileUpdate.vatNumber = String(identity.vatNumber).trim();
  if (businessType) profileUpdate.businessType = String(businessType).trim();
  if (!provider.bio) {
    profileUpdate.bio = `${identity?.companyName ? String(identity.companyName).trim() + ' · ' : ''}Verified professional`;
  }

  if (Object.keys(profileUpdate).length > 0) {
    await prisma.providerProfile.update({
      where: { id: provider.id },
      data: profileUpdate,
    }).catch(async (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('companyName') || msg.includes('businessType') || msg.includes('vatNumber') || msg.includes('column') || msg.includes('P2022')) {
        console.warn('[verification POST] business columns missing, writing bio only');
        if (typeof profileUpdate.bio === 'string') {
          await prisma.providerProfile.update({ where: { id: provider.id }, data: { bio: profileUpdate.bio } }).catch(() => {});
        }
      } else {
        throw err;
      }
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
