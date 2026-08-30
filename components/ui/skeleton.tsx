import React from 'react';
import { cn } from '@/lib/utils';

/* ─── Skeleton ──────────────────────────────────────────────────────────────
 * Warm loading placeholder — replaces full-page Loader2 spinners on list
 * pages and in `loading.tsx` route files. Server-component safe (no hooks,
 * no 'use client'), so it can be used directly inside Next `loading.tsx`.
 *
 * Dimensions always come from the caller; the primitive only owns the
 * surface treatment (warm surface-alt + hairline border, never gray-200).
 *
 * Usage:
 *   <Skeleton className="h-4 w-32" />
 *   <Skeleton className="w-10 h-10" rounded="full" />
 *   <SkeletonText lines={3} />
 *   <SkeletonCard />
 *   <SkeletonStat />
 * ────────────────────────────────────────────────────────────────────────── */

const ROUNDED = {
  chip:  'rounded-chip',
  input: 'rounded-input',
  card:  'rounded-card',
  panel: 'rounded-panel',
  full:  'rounded-full',
} as const;

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: keyof typeof ROUNDED;
}

export function Skeleton({
  rounded = 'input',
  className,
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse bg-surface-alt border border-border-dim/50',
        ROUNDED[rounded],
        className
      )}
      {...props}
    />
  );
}

/* ─── SkeletonText ──────────────────────────────────────────────────────────
 * Staggered-width copy block. The last line is always short so it reads as
 * a paragraph rather than a stack of bars.
 * ────────────────────────────────────────────────────────────────────────── */

const LINE_WIDTHS = ['w-full', 'w-11/12', 'w-4/5', 'w-full', 'w-3/4'];

export interface SkeletonTextProps {
  lines?:     number;
  className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          rounded="chip"
          className={cn(
            'h-3',
            i === lines - 1 ? 'w-1/2' : LINE_WIDTHS[i % LINE_WIDTHS.length]
          )}
        />
      ))}
    </div>
  );
}

/* ─── SkeletonCard ──────────────────────────────────────────────────────────
 * Mirrors the requests/bookings/messages list-row shape: avatar circle,
 * two stacked text lines, trailing status block.
 * ────────────────────────────────────────────────────────────────────────── */

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-card rounded-panel border border-border-dim p-4 shadow-card',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Skeleton rounded="full" className="w-10 h-10 shrink-0" />

        <div className="flex-1 min-w-0 space-y-2 pt-0.5">
          <Skeleton rounded="chip" className="h-3.5 w-2/5" />
          <Skeleton rounded="chip" className="h-3 w-3/4" />
        </div>

        <Skeleton rounded="chip" className="h-5 w-16 shrink-0" />
      </div>
    </div>
  );
}

/* ─── SkeletonStat ──────────────────────────────────────────────────────────
 * StatCard-shaped tile: icon square, big value, small label.
 * ────────────────────────────────────────────────────────────────────────── */

export function SkeletonStat({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-card rounded-card border border-border-dim p-5 shadow-card',
        className
      )}
    >
      <Skeleton className="w-10 h-10 mb-4" />
      <Skeleton rounded="chip" className="h-6 w-14" />
      <Skeleton rounded="chip" className="h-2.5 w-20 mt-2" />
    </div>
  );
}
