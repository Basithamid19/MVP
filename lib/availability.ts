import prisma from '@/lib/prisma';
import { vilniusParts } from '@/lib/time';

// Server-side availability enforcement for booking creation. Reads a provider's
// blackout dates, weekly working hours, and buffer, and validates a proposed
// `scheduledAt` against them. Imports Prisma — server-only, never import from a
// client component (use lib/time.ts there instead).

export type AvailabilityResult = { ok: true } | { ok: false; reason: string };

function hhmmToMinutes(t: string): number {
  const [h, m] = String(t).split(':').map((n) => parseInt(n, 10));
  return (h || 0) * 60 + (m || 0);
}

// Validates a booking slot for `providerProfileId` at `scheduledAt`.
// Degrades to "allow" (ok) on any DB/column error so an un-migrated DB or an
// internal fault never blocks a legitimate booking — enforcement is a guard,
// not a hard dependency.
export async function checkAvailability(
  providerProfileId: string,
  scheduledAt: Date,
): Promise<AvailabilityResult> {
  try {
    const provider = await prisma.providerProfile.findUnique({
      where: { id: providerProfileId },
      select: {
        bufferMins: true,
        blackoutDates: true,
        availability: { select: { dayOfWeek: true, startTime: true, endTime: true } },
      },
    });
    if (!provider) return { ok: true };

    const { isoDate, dayOfWeek, minutes } = vilniusParts(scheduledAt);

    // 1. Blackout date (stored as "YYYY-MM-DD").
    if (Array.isArray(provider.blackoutDates) && provider.blackoutDates.includes(isoDate)) {
      return { ok: false, reason: 'The provider is unavailable on this date. Please pick another day or message the pro.' };
    }

    // 2. Weekly working hours — only enforced when the provider has set a
    // schedule at all (empty schedule = no constraint).
    const slots = provider.availability ?? [];
    if (slots.length > 0) {
      const daySlots = slots.filter((s) => s.dayOfWeek === dayOfWeek);
      if (daySlots.length === 0) {
        return { ok: false, reason: 'The provider does not work on this day. Please pick another day or message the pro.' };
      }
      const withinHours = daySlots.some(
        (s) => minutes >= hhmmToMinutes(s.startTime) && minutes <= hhmmToMinutes(s.endTime),
      );
      if (!withinHours) {
        return { ok: false, reason: "The requested time is outside the provider's working hours. Please pick another time." };
      }
    }

    // 3. Buffer / overlap with an existing job. ±bufferMins window around the
    // start time (job durations aren't tracked, so this is a heuristic).
    const buffer = provider.bufferMins ?? 0;
    if (buffer > 0) {
      const windowStart = new Date(scheduledAt.getTime() - buffer * 60000);
      const windowEnd = new Date(scheduledAt.getTime() + buffer * 60000);
      const conflict = await prisma.booking.findFirst({
        where: {
          providerId: providerProfileId,
          status: { not: 'CANCELED' },
          scheduledAt: { gte: windowStart, lte: windowEnd },
        },
        select: { id: true },
      });
      if (conflict) {
        return { ok: false, reason: 'The provider already has a job around this time. Please pick another slot.' };
      }
    }

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes('column') || msg.includes('P2022') ||
      msg.includes('bufferMins') || msg.includes('blackoutDates')
    ) {
      console.warn('[availability] columns missing — skipping enforcement');
      return { ok: true };
    }
    console.error('[availability] check failed, allowing booking:', err);
    return { ok: true };
  }
}
