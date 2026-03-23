import React from 'react';
import { cn } from '@/lib/utils';

/* ─── EmptyState ────────────────────────────────────────────────────────────
 * Consistent empty/zero-data treatment across all dashboard sections.
 * Replaces the ad-hoc EmptyState helpers duplicated in admin + provider.
 *
 * Usage:
 *   <EmptyState
 *     icon={Inbox}
 *     title="No jobs posted yet"
 *     description="Describe your task and get quotes from local pros."
 *     action={<Button href="/requests/new">Post Your First Job</Button>}
 *   />
 *
 *   <EmptyState icon={ShieldCheck} title="No providers found." size="sm" />
 * ────────────────────────────────────────────────────────────────────────── */

type Size = 'xs' | 'sm' | 'md' | 'lg';

const SIZES: Record<Size, {
  wrapper:   string;
  iconWrap:  string;
  iconSize:  string;
  title:     string;
  desc:      string;
}> = {
  xs: {
    wrapper:  'py-6',
    iconWrap: 'w-9 h-9 mb-3',
    iconSize: 'w-4 h-4',
    title:    'text-xs font-semibold',
    desc:     'text-[11px]',
  },
  sm: {
    wrapper:  'py-8',
    iconWrap: 'w-11 h-11 mb-3',
    iconSize: 'w-5 h-5',
    title:    'text-sm font-semibold',
    desc:     'text-xs',
  },
  md: {
    wrapper:  'py-12',
    iconWrap: 'w-14 h-14 mb-4',
    iconSize: 'w-7 h-7',
    title:    'text-sm font-bold',
    desc:     'text-xs',
  },
  lg: {
    wrapper:  'py-16',
    iconWrap: 'w-16 h-16 mb-4',
    iconSize: 'w-8 h-8',
    title:    'text-base font-bold',
    desc:     'text-sm',
  },
};

export interface EmptyStateProps {
  icon:         React.ElementType;
  title:        string;
  description?: string;
  action?:      React.ReactNode;
  size?:        Size;
  className?:   string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = 'md',
  className,
}: EmptyStateProps) {
  const s = SIZES[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center text-center',
        s.wrapper,
        className
      )}
    >
      {/* Icon container */}
      <div
        className={cn(
          'bg-surface-alt rounded-2xl flex items-center justify-center',
          s.iconWrap
        )}
      >
        <Icon className={cn('text-ink-dim/60', s.iconSize)} />
      </div>

      {/* Title */}
      <p className={cn('text-ink mb-1.5', s.title)}>{title}</p>

      {/* Description */}
      {description && (
        <p
          className={cn(
            'text-ink-dim max-w-xs mx-auto leading-relaxed',
            action ? 'mb-6' : '',
            s.desc
          )}
        >
          {description}
        </p>
      )}

      {/* Action */}
      {action && <div>{action}</div>}
    </div>
  );
}
