import React from 'react';
import { cn } from '@/lib/utils';

/* ─── StatusBadge ───────────────────────────────────────────────────────────
 * Unified semantic badge/chip replacing all scattered inline badge styles.
 *
 * Variant → token mapping:
 *   success  → green   (trust, verified, completed, active)
 *   warning  → amber   (caution, pending, urgent)
 *   info     → blue    (informational, fast-reply, scheduled)
 *   danger   → red     (dispute, rejected, canceled)
 *   neutral  → warm gray (basic, default, unverified)
 *   brand    → green   (premium, pro-tier, featured)
 *   purple   → purple  (top-rated, special tier)
 *
 * Usage:
 *   <StatusBadge variant="success" label="Verified" />
 *   <StatusBadge variant="warning" label="Pending" dot />
 *   <StatusBadge variant="info"    label="Scheduled" />
 * ────────────────────────────────────────────────────────────────────────── */

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'info'
  | 'danger'
  | 'neutral'
  | 'brand'
  | 'purple';

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
  purple: {
    pill: 'bg-purple-50 text-purple-700 border border-purple-200',
    dot:  'bg-purple-500',
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
          ? 'px-2.5 py-0.5 text-[11px] uppercase tracking-wide'
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

/* ─── Convenience helpers ───────────────────────────────────────────────────
 * Map common domain strings to badge variants, used by booking/request pages.
 * ────────────────────────────────────────────────────────────────────────── */

export function bookingStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    SCHEDULED:   'info',
    IN_PROGRESS: 'warning',
    COMPLETED:   'success',
    CANCELED:    'danger',
  };
  return map[status] ?? 'neutral';
}

export function requestStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    NEW:       'info',
    QUOTED:    'success',
    CHATTING:  'brand',
    ACCEPTED:  'success',
    DECLINED:  'danger',
    EXPIRED:   'neutral',
    COMPLETED: 'neutral',
  };
  return map[status] ?? 'neutral';
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
