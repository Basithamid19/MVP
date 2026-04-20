import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  console.log('[provider/profile GET] userId:', userId, 'email:', session.user.email);
  if (!userId) return NextResponse.json({ error: 'Session missing user ID — please log out and log back in.' }, { status: 401 });

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
    console.warn('[provider/profile GET] primary query failed:', msg.slice(0, 200));
    // Fall back to only the guaranteed-stable scalar columns — no relations that
    // might also reference missing columns in related tables.
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      select: {
        id: true, userId: true, bio: true, serviceArea: true,
        languages: true, ratingAvg: true, completedJobs: true,
        isVerified: true, verificationTier: true, responseTime: true,
      },
    }).catch((fallbackErr: unknown) => {
      console.error('[provider/profile GET] fallback also failed:',
        fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr));
      return null;
    });
    // Fetch categories separately so a join-table issue never blocks core data
    const categories = profile
      ? await prisma.serviceCategory.findMany({
          where: { providers: { some: { userId } } },
          select: { id: true, name: true },
        }).catch(() => [])
      : [];
    return NextResponse.json(
      profile
        ? { ...profile, categories, offerings: [], availability: [], verifications: [],
            instantBook: false, bufferMins: 30, blackoutDates: [],
            _count: { bookings: 0, reviews: 0 } }
        : {}
    );
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
    console.log('[provider/profile PATCH] userId:', userId, 'email:', session.user.email);
    if (!userId) return NextResponse.json({ error: 'Session missing user ID — please log out and log back in.' }, { status: 401 });
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

    console.log('[provider/profile PATCH] userId:', userId, 'coreUpdate keys:', Object.keys(coreUpdate));

    // Explicit select — only original schema columns, never new/optional ones.
    const SAFE_RETURN_SELECT = {
      id: true, userId: true, bio: true, serviceArea: true,
      languages: true, ratingAvg: true, completedJobs: true,
      isVerified: true, verificationTier: true, responseTime: true,
    } as const;

    // Helper: true when error is about a missing DB column
    const isColErr = (e: unknown) => {
      const m = e instanceof Error ? e.message : String(e);
      return m.includes('instantBook') || m.includes('bufferMins') || m.includes('blackoutDates') ||
             m.includes('column') || m.includes('P2022');
    };

    // Use findFirst + update/create instead of upsert so Prisma never includes
    // potentially-missing columns (instantBook, bufferMins, blackoutDates) in the
    // INSERT column list, which would fail even for the ON CONFLICT UPDATE path.
    const existing = await prisma.providerProfile.findFirst({
      where: { userId },
      select: { id: true },
    }).catch(() => null);

    let profile;
    if (existing) {
      // UPDATE path — try with newFields, fall back to coreUpdate only
      profile = await prisma.providerProfile.update({
        where: { id: existing.id },
        data: { ...coreUpdate, ...newFields },
        select: SAFE_RETURN_SELECT,
      }).catch(async (err: unknown) => {
        console.error('[provider/profile PATCH] update error:', err instanceof Error ? err.message : String(err));
        if (isColErr(err)) {
          return prisma.providerProfile.update({
            where: { id: existing.id },
            data: coreUpdate,
            select: SAFE_RETURN_SELECT,
          });
        }
        throw err;
      });
    } else {
      // CREATE path: use raw SQL so Prisma never applies client-side defaults
      // for schema columns that don't exist in the DB yet
      // (instantBook, bufferMins, blackoutDates, stripeOnboarded, etc.).
      // Prisma ORM create() injects ALL @default values into the INSERT column
      // list even when they're absent from `data` — raw SQL is the only bypass.
      const newId = crypto.randomUUID();
      const bioVal = (bio ?? '').trim();
      const areaVal = serviceArea ?? '';
      const rtVal = responseTime ?? 'Usually responds in 1 hour';
      // Build a safe PostgreSQL array literal manually (avoids $executeRaw array quirks)
      const langsLiteral = '{' + (languages ?? ['Lithuanian'])
        .map(l => '"' + String(l).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"')
        .join(',') + '}';

      await prisma.$executeRaw`
        INSERT INTO "ProviderProfile" (
          id, "userId", bio, "serviceArea", languages, "responseTime",
          "ratingAvg", "completedJobs", "isVerified", "verificationTier"
        ) VALUES (
          ${newId}, ${userId}, ${bioVal}, ${areaVal},
          ${langsLiteral}::text[], ${rtVal},
          0, 0, false, 'TIER0_BASIC'::"VerificationTier"
        )
        ON CONFLICT ("userId") DO UPDATE SET
          bio = EXCLUDED.bio,
          "serviceArea" = EXCLUDED."serviceArea",
          languages = EXCLUDED.languages,
          "responseTime" = EXCLUDED."responseTime"
      `;

      profile = await prisma.providerProfile.findFirst({
        where: { userId },
        select: SAFE_RETURN_SELECT,
      });
      if (!profile) throw new Error('Profile could not be created');
    }

    console.log('[provider/profile PATCH] saved serviceArea:', profile.serviceArea, 'bio length:', profile.bio?.length ?? 0);

    // Update categories separately — keeps M2M join-table issues from rolling
    // back the core profile save.  Non-fatal: logs error but does not 500.
    if (Array.isArray(categoryIds)) {
      try {
        await prisma.providerProfile.update({
          where: { id: profile.id },
          data: { categories: { set: categoryIds.map((id: string) => ({ id })) } },
          select: { id: true },
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
