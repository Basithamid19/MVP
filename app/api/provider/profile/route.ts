import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Only columns that have existed since the initial migration. Used for
// read-back selects that must succeed even if newer migrations haven't run.
const SAFE_SCALAR_SELECT = {
  id: true,
  userId: true,
  bio: true,
  serviceArea: true,
  languages: true,
  ratingAvg: true,
  completedJobs: true,
  isVerified: true,
  verificationTier: true,
  responseTime: true,
} as const;

// Errors caused by a column that exists in schema.prisma but not in the DB yet.
function isColumnError(e: unknown): boolean {
  const m = e instanceof Error ? e.message : String(e);
  return (
    m.includes('P2022') ||
    m.includes('instantBook') ||
    m.includes('bufferMins') ||
    m.includes('blackoutDates') ||
    m.includes('stripeAccountId') ||
    m.includes('stripeOnboarded') ||
    m.includes('does not exist in the current database')
  );
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
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
  } catch (err) {
    // Newer columns missing — fall back to scalar-only select + separate relation fetches
    console.warn('[provider/profile GET] primary query failed, using fallback:',
      err instanceof Error ? err.message.slice(0, 200) : String(err));

    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      select: SAFE_SCALAR_SELECT,
    }).catch(() => null);

    if (!profile) return NextResponse.json({});

    const [categories, offerings, availability] = await Promise.all([
      prisma.serviceCategory.findMany({
        where: { providers: { some: { userId } } },
        select: { id: true, name: true },
      }).catch(() => []),
      prisma.serviceOffering.findMany({ where: { providerProfileId: profile.id } }).catch(() => []),
      prisma.availabilitySlot.findMany({ where: { providerProfileId: profile.id } }).catch(() => []),
    ]);

    return NextResponse.json({
      ...profile,
      categories,
      offerings,
      availability,
      verifications: [],
      instantBook: false,
      bufferMins: 30,
      blackoutDates: [],
      _count: { bookings: 0, reviews: 0 },
    });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  if (!userId) return NextResponse.json({ error: 'Session missing user ID — please log out and log back in.' }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const {
    bio, serviceArea, languages, responseTime,
    categoryIds, offerings, availability,
    instantBook, bufferMins, blackoutDates,
  } = body;

  // Validate offerings up-front
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

  // Build the UPDATE payload — only include keys that were sent. Undefined keys
  // are skipped entirely so sub-pages can PATCH a subset without clobbering others.
  const coreData: Record<string, unknown> = {};
  if (bio !== undefined) coreData.bio = typeof bio === 'string' ? bio.trim() : '';
  if (serviceArea !== undefined) coreData.serviceArea = typeof serviceArea === 'string' ? serviceArea.trim() : '';
  if (Array.isArray(languages)) coreData.languages = languages.map((l) => String(l).trim()).filter(Boolean);
  if (responseTime !== undefined) coreData.responseTime = responseTime;

  const newData: Record<string, unknown> = {};
  if (instantBook !== undefined) newData.instantBook = Boolean(instantBook);
  if (bufferMins !== undefined) newData.bufferMins = Number(bufferMins);
  if (Array.isArray(blackoutDates)) newData.blackoutDates = blackoutDates;

  try {
    // Resolve (or create) the ProviderProfile row.
    let existing = await prisma.providerProfile.findUnique({
      where: { userId },
      select: { id: true },
    }).catch(() => null);

    if (!existing) {
      // Create via raw SQL so Prisma doesn't inject @default values for columns
      // that may not yet exist in the DB. ON CONFLICT handles the race where
      // another request created the row between our read and our write.
      const newId = crypto.randomUUID();
      const bioVal = typeof coreData.bio === 'string' ? (coreData.bio as string) : '';
      const areaVal = typeof coreData.serviceArea === 'string' ? (coreData.serviceArea as string) : '';
      const langsArr = Array.isArray(coreData.languages) ? (coreData.languages as string[]) : ['Lithuanian'];
      const rtVal = (typeof coreData.responseTime === 'string' ? (coreData.responseTime as string) : null) ?? 'Usually responds in 1 hour';
      const langsLiteral = '{' + langsArr
        .map((l) => '"' + String(l).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"')
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

      existing = await prisma.providerProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!existing) {
        return NextResponse.json({ error: 'Failed to create provider profile.' }, { status: 500 });
      }
    }

    const profileId = existing.id;

    // Apply core field edits via raw SQL. Bypasses Prisma's query engine
    // entirely so there's no chance of client-side default injection, stale
    // prepared statements on the PgBouncer pool, or any other middleware quirk
    // swallowing the write. Only columns we know exist since the initial
    // migration are touched here — so this is safe on any DB state.
    if (Object.keys(coreData).length > 0) {
      const sets: string[] = [];
      const values: unknown[] = [];

      if ('bio' in coreData) {
        values.push(coreData.bio);
        sets.push(`"bio" = $${values.length}`);
      }
      if ('serviceArea' in coreData) {
        values.push(coreData.serviceArea);
        sets.push(`"serviceArea" = $${values.length}`);
      }
      if ('languages' in coreData) {
        const langsArr = Array.isArray(coreData.languages) ? (coreData.languages as string[]) : [];
        const langsLiteral = '{' + langsArr
          .map((l) => '"' + String(l).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"')
          .join(',') + '}';
        values.push(langsLiteral);
        sets.push(`"languages" = $${values.length}::text[]`);
      }
      if ('responseTime' in coreData) {
        values.push(coreData.responseTime);
        sets.push(`"responseTime" = $${values.length}`);
      }

      if (sets.length > 0) {
        values.push(profileId);
        const sql = `UPDATE "ProviderProfile" SET ${sets.join(', ')} WHERE "id" = $${values.length}`;
        const affected = await prisma.$executeRawUnsafe(sql, ...values);
        console.log('[provider/profile PATCH] core UPDATE affected', affected, 'rows', {
          profileId, keys: Object.keys(coreData),
        });
      }
    }

    // newData (instantBook, bufferMins, blackoutDates) may not exist on older
    // DBs — keep the Prisma path here so the column-error fallback can skip
    // it gracefully.
    if (Object.keys(newData).length > 0) {
      try {
        await prisma.providerProfile.update({
          where: { id: profileId },
          data: newData,
          select: { id: true },
        });
      } catch (err) {
        if (isColumnError(err)) {
          console.warn('[provider/profile PATCH] newer columns missing, skipping newData');
        } else {
          throw err;
        }
      }
    }

    // Categories — separate update, non-fatal. Treat missing `categoryIds` as
    // "don't touch"; empty array means "clear all".
    if (Array.isArray(categoryIds)) {
      try {
        await prisma.providerProfile.update({
          where: { id: profileId },
          data: { categories: { set: categoryIds.map((id: string) => ({ id })) } },
          select: { id: true },
        });
      } catch (catErr) {
        console.error('[provider/profile PATCH] categories update failed (non-fatal):', catErr);
      }
    }

    // Offerings
    if (Array.isArray(offerings)) {
      await prisma.serviceOffering.deleteMany({ where: { providerProfileId: profileId } });
      for (const o of offerings) {
        await prisma.serviceOffering.create({
          data: {
            providerProfileId: profileId,
            name: (o.name ?? '').trim(),
            description: (o.description ?? '').trim() || null,
            price: parseFloat(o.price),
            priceType: o.priceType ?? 'HOURLY',
          },
        });
      }
    }

    // Availability
    if (Array.isArray(availability)) {
      await prisma.availabilitySlot.deleteMany({ where: { providerProfileId: profileId } });
      for (const slot of availability) {
        await prisma.availabilitySlot.create({
          data: {
            providerProfileId: profileId,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
          },
        });
      }
    }

    // Re-read from the DB so the client sees ground truth, not a racy cache
    // or a silently-failed UPDATE result. Use scalar select as the fallback
    // path so a missing newer column never swallows the response.
    const persisted = await prisma.providerProfile.findUnique({
      where: { id: profileId },
      select: SAFE_SCALAR_SELECT,
    });

    if (!persisted) {
      return NextResponse.json({ error: 'Profile disappeared after save.' }, { status: 500 });
    }

    const [categories, offeringsRows, availabilityRows] = await Promise.all([
      prisma.serviceCategory.findMany({
        where: { providers: { some: { id: profileId } } },
        select: { id: true, name: true },
      }).catch(() => []),
      prisma.serviceOffering.findMany({ where: { providerProfileId: profileId } }).catch(() => []),
      prisma.availabilitySlot.findMany({ where: { providerProfileId: profileId } }).catch(() => []),
    ]);

    // Read newer columns (instantBook/bufferMins/blackoutDates) separately so
    // GET and PATCH expose the same canonical field set. Fall back to defaults
    // when the migration hasn't run yet — mirrors the GET fallback path above.
    let instantBookOut = false;
    let bufferMinsOut = 30;
    let blackoutDatesOut: string[] = [];
    try {
      const extra: any = await prisma.providerProfile.findUnique({
        where: { id: profileId },
        select: { instantBook: true, bufferMins: true, blackoutDates: true } as any,
      });
      if (extra) {
        instantBookOut = Boolean(extra.instantBook);
        bufferMinsOut = typeof extra.bufferMins === 'number' ? extra.bufferMins : 30;
        blackoutDatesOut = Array.isArray(extra.blackoutDates) ? extra.blackoutDates : [];
      }
    } catch (extraErr) {
      if (!isColumnError(extraErr)) throw extraErr;
    }

    return NextResponse.json({
      ...persisted,
      categories,
      offerings: offeringsRows,
      availability: availabilityRows,
      instantBook: instantBookOut,
      bufferMins: bufferMinsOut,
      blackoutDates: blackoutDatesOut,
    });
  } catch (err) {
    console.error('[provider/profile PATCH] fatal:', err);
    return NextResponse.json({ error: 'Failed to save profile. Please try again.' }, { status: 500 });
  }
}
