import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await prisma.providerProfile.findUnique({
    where: { userId: (session.user as any).id },
    include: {
      user: { select: { name: true, email: true, image: true } },
      categories: true,
      offerings: true,
      availability: true,
      verifications: true,
      _count: { select: { bookings: true, reviews: true } },
    },
  });
  return NextResponse.json(profile ?? {});
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const {
      bio, serviceArea, languages, responseTime,
      categoryIds, offerings, availability,
      instantBook, bufferMins, blackoutDates,
    } = body;

    const userId = (session.user as any).id;

    // Validate offerings before touching the DB
    if (Array.isArray(offerings) && offerings.length > 0) {
      for (const o of offerings) {
        const name = (o.name ?? '').trim();
        if (name.length < 3) {
          return NextResponse.json({ error: `Service name "${name || '(empty)'}" must be at least 3 characters.` }, { status: 400 });
        }
        const desc = (o.description ?? '').trim();
        if (desc.length > 0 && desc.length < 20) {
          return NextResponse.json({ error: `Description for "${name}" must be at least 20 characters if provided.` }, { status: 400 });
        }
        const price = parseFloat(o.price);
        if (isNaN(price) || price < 0) {
          return NextResponse.json({ error: `Price for "${name}" must be a valid positive number.` }, { status: 400 });
        }
      }
    }

    const profile = await prisma.providerProfile.upsert({
      where: { userId },
      update: {
        ...(bio !== undefined && { bio: bio.trim() }),
        ...(serviceArea !== undefined && { serviceArea }),
        ...(languages !== undefined && { languages }),
        ...(responseTime !== undefined && { responseTime }),
        ...(instantBook !== undefined && { instantBook: Boolean(instantBook) }),
        ...(bufferMins !== undefined && { bufferMins: Number(bufferMins) }),
        ...(blackoutDates !== undefined && Array.isArray(blackoutDates) && { blackoutDates }),
        ...(categoryIds && {
          categories: { set: categoryIds.map((id: string) => ({ id })) },
        }),
      },
      create: {
        userId,
        bio: bio ?? '',
        serviceArea: serviceArea ?? 'Vilnius',
        languages: languages ?? ['Lithuanian'],
        responseTime: responseTime ?? 'Usually responds in 1 hour',
        instantBook: Boolean(instantBook ?? false),
        bufferMins: Number(bufferMins ?? 30),
        blackoutDates: Array.isArray(blackoutDates) ? blackoutDates : [],
        ...(categoryIds?.length && {
          categories: { connect: categoryIds.map((id: string) => ({ id })) },
        }),
      },
    });

    // Save offerings (only modify if array explicitly sent)
    if (Array.isArray(offerings)) {
      await prisma.serviceOffering.deleteMany({ where: { providerProfileId: profile.id } });
      for (const o of offerings) {
        await prisma.serviceOffering.create({
          data: {
            providerProfileId: profile.id,
            name: (o.name ?? '').trim(),
            description: (o.description ?? '').trim() || null,
            price: parseFloat(o.price),
            priceType: o.priceType ?? 'HOURLY',
          },
        });
      }
    }

    // Save availability (only modify if array explicitly sent)
    if (Array.isArray(availability)) {
      await prisma.availabilitySlot.deleteMany({ where: { providerProfileId: profile.id } });
      for (const slot of availability) {
        await prisma.availabilitySlot.create({
          data: {
            providerProfileId: profile.id,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
          },
        });
      }
    }

    return NextResponse.json(profile);
  } catch (err) {
    console.error('[provider/profile PATCH]', err);
    return NextResponse.json({ error: 'Failed to save profile. Please try again.' }, { status: 500 });
  }
}
