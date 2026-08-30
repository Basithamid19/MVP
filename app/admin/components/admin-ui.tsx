'use client';

import React from 'react';
import { RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

/* ─── Admin-only presentational bits ────────────────────────────────────────
 * Anything reusable across modules that is genuinely admin-specific and so
 * does not belong in components/ui. The old local ModuleHeader / Badge /
 * AdminEmpty are gone — PageHeader / StatusBadge / EmptyState replace them.
 * Admin is an internal English-only tool, so no i18n dictionary here.
 * ────────────────────────────────────────────────────────────────────────── */

/* ── Filter chips ───────────────────────────────────────────────────────── */

export function FilterChip({
  label,
  active,
  count,
  onClick,
}: {
  label:    string;
  active:   boolean;
  count?:   number;
  onClick:  () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'shrink-0 px-3 py-1.5 rounded-input text-xs font-semibold',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2',
        active
          ? 'bg-brand text-white shadow-card'
          : 'bg-card border border-border-dim text-ink-sub hover:border-border hover:text-ink'
      )}
    >
      {label}{count != null ? ` (${count})` : ''}
    </button>
  );
}

/** Horizontally scrollable chip row — one filter vocabulary per module. */
export function FilterBar({
  options,
  value,
  onChange,
  count,
  className,
}: {
  options:  { value: string; label: string }[];
  value:    string;
  onChange: (v: string) => void;
  count?:   (v: string) => number;
  className?: string;
}) {
  return (
    <div className={cn('flex gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none', className)}>
      {options.map(o => (
        <FilterChip
          key={o.value}
          label={o.label}
          active={value === o.value}
          count={count?.(o.value)}
          onClick={() => onChange(o.value)}
        />
      ))}
    </div>
  );
}

/* ── Summary strip ──────────────────────────────────────────────────────── */

export interface SummaryItem {
  label: string;
  value: string | number;
  /** Emphasis colour for counts that demand attention. */
  tone?: 'default' | 'caution' | 'danger' | 'trust';
}

const TONE = {
  default: 'text-ink',
  caution: 'text-caution',
  danger:  'text-danger',
  trust:   'text-trust',
} as const;

/** Compact inline counts above a table — cheaper than a StatCard row. */
export function SummaryStrip({ items }: { items: SummaryItem[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4 text-xs text-ink-dim">
      {items.map(i => (
        <span key={i.label}>
          <span className={cn('font-bold tabular-nums', TONE[i.tone ?? 'default'])}>{i.value}</span>{' '}
          {i.label}
        </span>
      ))}
    </div>
  );
}

/* ── Refresh action ─────────────────────────────────────────────────────── */

export function RefreshButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} aria-label="Refresh">
      <RefreshCcw className="w-4 h-4" />
      <span className="hidden sm:inline">Refresh</span>
    </Button>
  );
}

/* ── Formatters ─────────────────────────────────────────────────────────── */

export const eur = (n: number | null | undefined) => `€${(n ?? 0).toFixed(2)}`;

export const shortDate = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—';

export const shortDateYear = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }) : '—';

export const daysSince = (d: string | Date) =>
  Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24));

export const time = (d: string | Date) =>
  new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/* ── Mobile card scaffold ───────────────────────────────────────────────── */

/** The < sm counterpart of a table row. One card language across all modules. */
export function MobileRowCard({
  className,
  children,
}: {
  className?: string;
  children:   React.ReactNode;
}) {
  return (
    <div className={cn('bg-card rounded-card border border-border-dim p-4 shadow-card', className)}>
      {children}
    </div>
  );
}

/** Two-party "customer → provider" line, used by bookings/disputes/reviews. */
export function PartyPair({ from, to }: { from?: string | null; to?: string | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 min-w-0 text-xs">
      <span className="font-medium text-ink-sub truncate">{from ?? '—'}</span>
      <span className="text-ink-dim shrink-0">→</span>
      <span className="font-medium text-ink-sub truncate">{to ?? '—'}</span>
    </span>
  );
}
