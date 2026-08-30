'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/* ─── SegmentedFilter ───────────────────────────────────────────────────────
 * The filter-chip row previously copy-pasted (with drift) across the provider
 * jobs / leads / quotes pages. One implementation, one look.
 *
 * Usage:
 *   <SegmentedFilter
 *     options={[{ id: 'all', label: t.jobs.all, count: 12 }, …]}
 *     value={filter}
 *     onChange={setFilter}
 *   />
 * ────────────────────────────────────────────────────────────────────────── */

export interface SegmentedFilterOption {
  id:     string;
  label:  string;
  count?: number;
}

export interface SegmentedFilterProps {
  options:    SegmentedFilterOption[];
  value:      string;
  onChange:   (id: string) => void;
  className?: string;
}

export function SegmentedFilter({ options, value, onChange, className }: SegmentedFilterProps) {
  return (
    <div className={cn('flex items-center gap-1.5 overflow-x-auto scrollbar-none', className)}>
      {options.map(opt => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            aria-pressed={active}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full',
              'text-xs font-bold whitespace-nowrap shrink-0',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2',
              active
                ? 'bg-brand text-white shadow-card'
                : 'bg-card text-ink-sub border border-border hover:border-border-dim hover:text-ink',
            )}
          >
            {opt.label}
            {typeof opt.count === 'number' && (
              <span className={cn('text-2xs font-bold', active ? 'text-white/70' : 'text-ink-dim')}>
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
