// Shared detector for "column exists in schema.prisma but not in the deployed DB yet"
// errors. Covers Prisma P2022, the generic Prisma "does not exist" message, and
// the specific newer column names currently guarded by the codebase. Used by
// routes that must degrade gracefully when a migration has not yet run in a
// given environment.
export function isColumnError(e: unknown): boolean {
  const m = e instanceof Error ? e.message : String(e);
  return (
    m.includes('P2022') ||
    m.includes('instantBook') ||
    m.includes('bufferMins') ||
    m.includes('blackoutDates') ||
    m.includes('stripeAccountId') ||
    m.includes('stripeOnboarded') ||
    m.includes('verifiedAt') ||
    m.includes('AuthToken') ||
    // 20260710 negotiation columns. 'kind' is deliberately absent — the word
    // is too generic to match safely in an error string; the generic
    // 'does not exist' / P2022 checks below cover a missing ChatMessage.kind.
    m.includes('currentPrice') ||
    m.includes('.turn') || // matches "Quote.turn"; a bare 'turn' would hit "returned"
    m.includes('payload') ||
    m.includes('does not exist in the current database')
  );
}
