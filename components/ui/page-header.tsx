import React from 'react';
import { cn } from '@/lib/utils';

/* ─── PageHeader ────────────────────────────────────────────────────────────
 * Consistent page/module header used across admin, provider, and customer
 * dashboards. Replaces the duplicated ModuleHeader in admin + scattered
 * inline headers throughout provider and customer views.
 *
 * Usage:
 *   <PageHeader
 *     title="Analytics Dashboard"
 *     description="Requests, conversions, and GMV."
 *     action={<Button size="sm" variant="secondary"><RefreshCcw /> Refresh</Button>}
 *   />
 *
 *   <PageHeader title="Earnings" size="lg" />
 * ────────────────────────────────────────────────────────────────────────── */

export interface PageHeaderProps {
  title:        string;
  description?: string;
  action?:      React.ReactNode;
  eyebrow?:     string;
  size?:        'sm' | 'md' | 'lg';
  className?:   string;
}

export function PageHeader({
  title,
  description,
  action,
  eyebrow,
  size = 'md',
  className,
}: PageHeaderProps) {
  const titleSize = {
    sm: 'text-lg font-bold',
    md: 'text-2xl font-bold tracking-tight',
    lg: 'text-3xl font-bold tracking-tight',
  }[size];

  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 mb-8',
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-ink-dim mb-2">
            {eyebrow}
          </p>
        )}
        <h1 className={cn('text-ink', titleSize)}>{title}</h1>
        {description && (
          <p className="text-sm text-ink-sub mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="shrink-0 flex items-center gap-2">{action}</div>
      )}
    </div>
  );
}

/* ─── SectionHeader ─────────────────────────────────────────────────────────
 * Lighter weight header for card sections within a page.
 * ────────────────────────────────────────────────────────────────────────── */

export interface SectionHeaderProps {
  title:      string;
  action?:    React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <h2 className="font-bold text-base text-ink">{title}</h2>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
