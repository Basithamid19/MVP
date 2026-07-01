// Timezone-aware helpers for the (Vilnius-only) marketplace.
//
// The app stores instants (`DateTime`) but all user-facing scheduling is in
// Vilnius local time. A date-only `<input type="date">` value like
// "2026-07-05" parsed with `new Date(...)` lands on UTC midnight, which renders
// as 02:00/03:00 for a Vilnius (UTC+2/+3) user and can shift the calendar day.
// These helpers construct and read instants against Europe/Vilnius correctly
// across DST. Pure module — safe to import from client components (no Prisma).

export const APP_TZ = 'Europe/Vilnius';

// Representative local start hour for each request time-of-day preference.
export const TIME_OF_DAY_HOURS: Record<string, number> = {
  morning: 9,
  afternoon: 13,
  evening: 17,
  flexible: 9,
};

// Millisecond offset of `tz` from UTC at the given instant. Positive = ahead of
// UTC. Works across DST because it asks Intl what wall-clock time `date` shows
// in each zone and subtracts; the server's own timezone cancels out.
function tzOffsetMs(date: Date, tz: string): number {
  const utc = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const local = new Date(date.toLocaleString('en-US', { timeZone: tz }));
  return local.getTime() - utc.getTime();
}

// Vilnius-local calendar parts of an instant.
export function vilniusParts(date: Date): { isoDate: string; dayOfWeek: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TZ,
    weekday: 'short',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date).reduce<Record<string, string>>((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});

  const isoDate = `${parts.year}-${parts.month}-${parts.day}`;
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dayOfWeek = weekdayMap[parts.weekday] ?? date.getUTCDay();
  // Intl renders midnight as "24" in some engines; normalize to 0.
  const hour = parseInt(parts.hour, 10) % 24;
  const minutes = hour * 60 + parseInt(parts.minute, 10);
  return { isoDate, dayOfWeek, minutes };
}

// Build the instant for a Vilnius wall-clock date + hour.
// `dateInput` may be a Date (e.g. an existing dateWindow) or a "YYYY-MM-DD"
// string. We take its Vilnius-local calendar date, then place the given local
// hour on that date and convert back to a UTC instant.
export function buildVilniusScheduledAt(dateInput: Date | string, timeOfDay?: string | null): Date {
  const isoDate =
    typeof dateInput === 'string'
      ? dateInput.slice(0, 10)
      : vilniusParts(dateInput).isoDate;

  const hour = TIME_OF_DAY_HOURS[timeOfDay ?? 'flexible'] ?? 9;
  const hh = String(hour).padStart(2, '0');

  // Treat "isoDate hh:00" as if it were UTC, then subtract the Vilnius offset
  // at that moment so the stored instant represents that Vilnius wall time.
  const naiveUtc = new Date(`${isoDate}T${hh}:00:00.000Z`);
  const offset = tzOffsetMs(naiveUtc, APP_TZ);
  return new Date(naiveUtc.getTime() - offset);
}

// Format an instant in Vilnius time. Accepts Date or ISO string.
export function formatVilnius(
  date: Date | string,
  options: Intl.DateTimeFormatOptions,
  locale = 'en-GB',
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, { timeZone: APP_TZ, ...options }).format(d);
}
