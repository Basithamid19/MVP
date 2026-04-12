import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;

  try {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
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
  } catch (err: unknown) {
    // If new columns (instantBook / bufferMins / blackoutDates) aren't in the DB yet,
    // fall back to selecting only the columns that have always existed so the page loads.
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes('instantBook') || msg.includes('bufferMins') ||
      msg.includes('blackoutDates') || msg.includes('column') || msg.includes('P2022')
    ) {
      console.warn('[provider/profile GET] new columns missing, returning core fields only');
      const profile = await prisma.providerProfile.findUnique({
        where: { userId },
        select: {
          id: true, userId: true, bio: true, serviceArea: true,
          languages: true, ratingAvg: true, completedJobs: true,
          isVerified: true, verificationTier: true, responseTime: true,
          categories: true, offerings: true, availability: true,
          verifications: true,
          _count: { select: { bookings: true, reviews: true } },
          user: { select: { name: true, email: true, image: true } },
        },
      }).catch(() => null);
      return NextResponse.json(
        profile ? { ...profile, instantBook: false, bufferMins: 30, blackoutDates: [] } : {}
      );
    }
    console.error('[provider/profile GET]', err);
    return NextResponse.json({ error: 'Failed to load profile.' }, { status: 500 });
  }
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

    // Build the core update — fields that have existed since the initial schema.
    // These must never fail due to migration state.
    // NOTE: categories are intentionally NOT included here — they are updated
    // in a separate step below so that an M2M join-table failure (e.g. Supabase
    // RLS on _ProviderProfileToServiceCategory) never rolls back the core fields.
    const coreUpdate: Record<string, unknown> = {
      ...(bio !== undefined && { bio: bio.trim() }),
      ...(serviceArea !== undefined && { serviceArea }),
      ...(languages !== undefined && { languages }),
      ...(responseTime !== undefined && { responseTime }),
    };

    // New fields added in migration 20260412000000_add_provider_booking_settings.
    // Applied separately so a missing column does not break the core save.
    const newFields: Record<string, unknown> = {
      ...(instantBook !== undefined && { instantBook: Boolean(instantBook) }),
      ...(bufferMins !== undefined && { bufferMins: Number(bufferMins) }),
      ...(blackoutDates !== undefined && Array.isArray(blackoutDates) && { blackoutDates }),
    };

    let profile = await prisma.providerProfile.upsert({
      where: { userId },
      update: { ...coreUpdate, ...newFields },
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
    }).catch(async (err: unknown) => {
      // If the upsert failed because the new columns don't exist yet (migration
      // not yet applied), retry with only the core fields so bio/area/etc. still save.
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('instantBook') || msg.includes('bufferMins') || msg.includes('blackoutDates') || msg.includes('column') || msg.includes('P2022')) {
        console.warn('[provider/profile PATCH] new columns missing, saving core fields only');
        return prisma.providerProfile.upsert({
          where: { userId },
          update: coreUpdate,
          create: {
            userId,
            bio: bio ?? '',
            serviceArea: serviceArea ?? 'Vilnius',
            languages: languages ?? ['Lithuanian'],
            responseTime: responseTime ?? 'Usually responds in 1 hour',
            ...(categoryIds?.length && {
              categories: { connect: categoryIds.map((id: string) => ({ id })) },
            }),
          },
        });
      }
      throw err;
    });

    // Update categories separately — keeps M2M join-table issues from rolling
    // back the core profile save.  Non-fatal: logs error but does not 500.
    if (Array.isArray(categoryIds)) {
      try {
        await prisma.providerProfile.update({
          where: { id: profile.id },
          data: { categories: { set: categoryIds.map((id: string) => ({ id })) } },
        });
      } catch (catErr) {
        console.error('[provider/profile PATCH] categories update failed (non-fatal):', catErr);
      }
    }

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
