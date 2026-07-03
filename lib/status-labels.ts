// Canonical display labels + badge classes for the three status vocabularies
// (ServiceRequest, Booking, Payment). Before this module, four pages carried
// divergent local maps — the same pipeline read "Accepted" / "Selected" /
// "Booked" depending on the surface. Display-layer only; enum values in the
// DB are untouched. Pure module — safe for client components.

import type { Dictionary } from '@/lib/i18n/types';

export type StatusInfo = { label: string; cls: string };

const FALLBACK: StatusInfo = { label: '', cls: 'bg-surface-alt text-ink-sub' };

export const REQUEST_STATUS: Record<string, StatusInfo> = {
  NEW:      { label: 'Waiting for quotes', cls: 'bg-info-surface text-info' },
  CHATTING: { label: 'In discussion',      cls: 'bg-brand-muted text-brand-dark' },
  QUOTED:   { label: 'Quotes received',    cls: 'bg-trust-surface text-trust' },
  ACCEPTED: { label: 'Booked',             cls: 'bg-brand text-white' },
  DECLINED: { label: 'Declined',           cls: 'bg-danger-surface text-danger' },
  EXPIRED:  { label: 'Expired',            cls: 'bg-surface-alt text-ink-sub' },
};

export const BOOKING_STATUS: Record<string, StatusInfo> = {
  SCHEDULED:   { label: 'Scheduled',   cls: 'bg-info-surface text-info' },
  IN_PROGRESS: { label: 'In progress', cls: 'bg-caution-surface text-caution' },
  COMPLETED:   { label: 'Completed',   cls: 'bg-trust-surface text-trust' },
  CANCELED:    { label: 'Canceled',    cls: 'bg-danger-surface text-danger' },
};

export const PAYMENT_STATUS: Record<string, StatusInfo> = {
  PENDING:        { label: 'Deposit required',   cls: 'bg-caution-surface text-caution' },
  DEPOSIT_HELD:   { label: 'Deposit held',       cls: 'bg-info-surface text-info' },
  PROCESSING:     { label: 'Processing',         cls: 'bg-info-surface text-info' },
  PAID:           { label: 'Paid',               cls: 'bg-trust-surface text-trust' },
  REFUNDED:       { label: 'Refunded',           cls: 'bg-surface-alt text-ink-sub' },
  PARTIAL_REFUND: { label: 'Partially refunded', cls: 'bg-surface-alt text-ink-sub' },
};

export function requestStatus(status: string): StatusInfo {
  return REQUEST_STATUS[status] ?? { ...FALLBACK, label: status };
}

export function bookingStatus(status: string): StatusInfo {
  return BOOKING_STATUS[status] ?? { ...FALLBACK, label: status };
}

export function paymentStatus(status: string | undefined | null): StatusInfo | null {
  if (!status) return null;
  return PAYMENT_STATUS[status] ?? { ...FALLBACK, label: status };
}

// Locale-aware variant: returns the dictionary translation for known statuses
// while keeping the canonical badge classes. Falls back to the English label
// already defined above for unknown/unmapped statuses. Enum values and class
// strings are untouched — display layer only.
export function localizedStatus(
  dict: Dictionary,
  kind: 'request' | 'booking' | 'payment',
  status: string,
): StatusInfo {
  const base =
    kind === 'request'
      ? requestStatus(status)
      : kind === 'booking'
      ? bookingStatus(status)
      : paymentStatus(status) ?? { ...FALLBACK, label: status };
  const section = dict.statuses[kind] as Record<string, string>;
  const label = section[status];
  return label ? { label, cls: base.cls } : base;
}
