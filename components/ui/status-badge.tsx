import React from 'react';
import { cn } from '@/lib/utils';
import { localizedStatus } from '@/lib/status-labels';
import type { Dictionary } from '@/lib/i18n/types';

/* ─── StatusBadge ───────────────────────────────────────────────────────────
 * THE badge primitive. Two entry points:
 *
 *   1. Visual — pick a variant yourself:
 *        <StatusBadge variant="success" label="Verified" />
 *
 *   2. Domain — pass a status enum + the i18n dictionary and get the
 *      canonical translated label + variant for that pipeline:
 *        <DomainStatusBadge kind="booking" status={b.status} dict={t} />
 *
 * Variant → token mapping:
 *   success    → trust green   (verified, completed, paid)
 *   warning    → caution amber (pending, in progress, urgent)
 *   info       → info blue     (scheduled, deposit held, new)
 *   danger     → danger red    (dispute, declined, canceled)
 *   neutral    → warm gray     (basic, expired, refunded)
 *   brand      → jade tint     (in discussion, pro-tier, featured)
 *   brandSolid → solid jade    (booked/accepted — the one "win" state)
 * ────────────────────────────────────────────────────────────────────────── */

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'info'
  | 'danger'
  | 'neutral'
  | 'brand'
  | 'brandSolid';

const BADGE: Record<BadgeVariant, { pill: string; dot: string }> = {
  success: {
    pill: 'bg-trust-surface text-trust border border-trust-edge',
    dot:  'bg-trust',
  },
  warning: {
    pill: 'bg-caution-surface text-caution border border-caution-edge',
    dot:  'bg-caution',
  },
  info: {
    pill: 'bg-info-surface text-info border border-info-edge',
    dot:  'bg-info',
  },
  danger: {
    pill: 'bg-danger-surface text-danger border border-danger-edge',
    dot:  'bg-danger',
  },
  neutral: {
    pill: 'bg-surface-alt text-ink-sub border border-border',
    dot:  'bg-ink-dim',
  },
  brand: {
    pill: 'bg-brand-muted text-brand border border-brand/20',
    dot:  'bg-brand',
  },
  brandSolid: {
    pill: 'bg-brand text-white border border-brand',
    dot:  'bg-white',
  },
};

export interface StatusBadgeProps {
  variant:    BadgeVariant;
  label:      string;
  dot?:       boolean;
  size?:      'sm' | 'md';
  className?: string;
}

export function StatusBadge({
  variant,
  label,
  dot,
  size = 'sm',
  className,
}: StatusBadgeProps) {
  const { pill, dot: dotColor } = BADGE[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold rounded-chip',
        size === 'sm'
          ? 'px-2.5 py-0.5 text-2xs uppercase tracking-wide'
          : 'px-3 py-1 text-xs uppercase tracking-wide',
        pill,
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor)} />}
      {label}
    </span>
  );
}

/* ─── Domain variant maps ───────────────────────────────────────────────────
 * One source of truth per pipeline, matched to lib/status-labels.ts colors.
 * ────────────────────────────────────────────────────────────────────────── */

const REQUEST_VARIANT: Record<string, BadgeVariant> = {
  NEW:       'info',
  CHATTING:  'brand',
  QUOTED:    'success',
  ACCEPTED:  'brandSolid',
  DECLINED:  'danger',
  EXPIRED:   'neutral',
};

const BOOKING_VARIANT: Record<string, BadgeVariant> = {
  SCHEDULED:   'info',
  IN_PROGRESS: 'warning',
  COMPLETED:   'success',
  CANCELED:    'danger',
};

const PAYMENT_VARIANT: Record<string, BadgeVariant> = {
  PENDING:        'warning',
  DEPOSIT_HELD:   'info',
  PROCESSING:     'info',
  PAID:           'success',
  REFUNDED:       'neutral',
  PARTIAL_REFUND: 'neutral',
};

export function statusVariant(
  kind: 'request' | 'booking' | 'payment',
  status: string,
): BadgeVariant {
  const map =
    kind === 'request' ? REQUEST_VARIANT :
    kind === 'booking' ? BOOKING_VARIANT :
    PAYMENT_VARIANT;
  return map[status] ?? 'neutral';
}

export interface DomainStatusBadgeProps {
  kind:       'request' | 'booking' | 'payment';
  status:     string;
  dict:       Dictionary;
  dot?:       boolean;
  size?:      'sm' | 'md';
  className?: string;
}

/** Translated label + canonical variant for a domain status enum. */
export function DomainStatusBadge({
  kind,
  status,
  dict,
  dot,
  size,
  className,
}: DomainStatusBadgeProps) {
  const { label } = localizedStatus(dict, kind, status);
  return (
    <StatusBadge
      variant={statusVariant(kind, status)}
      label={label}
      dot={dot}
      size={size}
      className={className}
    />
  );
}

export function verificationTierVariant(tier: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    TIER0_BASIC:          'neutral',
    TIER1_ID_VERIFIED:    'info',
    TIER2_TRADE_VERIFIED: 'brand',
    TIER3_ENHANCED:       'success',
  };
  return map[tier] ?? 'neutral';
}
