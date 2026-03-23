import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/* ─── StatCard ──────────────────────────────────────────────────────────────
 * Shared metric/KPI card used across provider and admin dashboards.
 * Renders as a <Link> when `href` is provided, plain <div> otherwise.
 *
 * Usage:
 *   <StatCard
 *     label="New Leads"
 *     value={12}
 *     sub="3 new today"
 *     icon={Inbox}
 *     iconClassName="bg-info-surface text-info"
 *     href="/provider/leads"
 *     badge={3}
 *   />
 * ────────────────────────────────────────────────────────────────────────── */

export interface StatCardProps {
  label:          string;
  value:          string | number;
  sub?:           string;
  icon?:          React.ElementType;
  iconClassName?: string;
  href?:          string;
  badge?:         number | null;
  trend?:         { value: string; positive?: boolean };
  className?:     string;
}

function StatCardInner({
  label,
  value,
  sub,
  icon: Icon,
  iconClassName,
  badge,
  trend,
}: Omit<StatCardProps, 'href' | 'className'>) {
  return (
    <>
      {/* Notification badge */}
      {badge != null && badge > 0 && (
        <span className="absolute top-3 right-3 min-w-[20px] h-5 bg-caution text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
          {badge > 9 ? '9+' : badge}
        </span>
      )}

      {/* Icon */}
      {Icon && (
        <div
          className={cn(
            'w-10 h-10 rounded-input flex items-center justify-center mb-4 shrink-0',
            iconClassName ?? 'bg-surface-alt text-ink-sub'
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      )}

      {/* Value */}
      <p className="text-2xl font-bold tracking-tight text-ink tabular-nums">
        {value}
      </p>

      {/* Label */}
      <p className="text-xs font-semibold text-ink-dim mt-0.5 uppercase tracking-wide">
        {label}
      </p>

      {/* Sub-label / context */}
      {sub && (
        <p className="text-[11px] text-ink-dim mt-1 font-medium">{sub}</p>
      )}

      {/* Trend indicator */}
      {trend && (
        <p
          className={cn(
            'text-[11px] font-semibold mt-2',
            trend.positive ? 'text-trust' : 'text-caution'
          )}
        >
          {trend.positive ? '↑' : '↓'} {trend.value}
        </p>
      )}
    </>
  );
}

export function StatCard({
  href,
  className,
  ...rest
}: StatCardProps) {
  const base = cn(
    'relative bg-white border border-border-dim rounded-card p-5 shadow-card',
    href && [
      'transition-all duration-150',
      'hover:border-border hover:shadow-elevated hover:-translate-y-0.5',
      'cursor-pointer group',
    ],
    className
  );

  if (href) {
    return (
      <Link href={href} className={base}>
        <StatCardInner {...rest} />
      </Link>
    );
  }

  return (
    <div className={base}>
      <StatCardInner {...rest} />
    </div>
  );
}
