'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { avatarUrl } from '@/lib/avatar';

/* ─── Avatar ────────────────────────────────────────────────────────────────
 * THE avatar. One component, one fallback palette — `avatarUrl()` from
 * lib/avatar.ts is the only source of generated avatars in the app. Do not
 * hand-build ui-avatars URLs or reach for pravatar/randomuser anywhere else.
 *
 * Plain <img> rather than next/image: sources are remote, arbitrary and
 * frequently 404 (seeded/imported profiles), so the onError swap to the
 * deterministic fallback matters more than the optimizer here.
 *
 * Usage:
 *   <Avatar src={p.photoUrl} name={p.businessName} size="lg" />
 *   <Avatar src={null} name="Jonas K." size="sm" shape="square" />
 *   <AvatarStack people={reviewers} max={4} size="xs" />
 * ────────────────────────────────────────────────────────────────────────── */

const SIZES = {
  xs: 'w-6  h-6',
  sm: 'w-8  h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
} as const;

/** Request a source image roughly matching the rendered box (2× for retina). */
const PIXELS: Record<keyof typeof SIZES, number> = {
  xs: 48, sm: 64, md: 80, lg: 112, xl: 160,
};

export type AvatarSize = keyof typeof SIZES;

export interface AvatarProps {
  src?:       string | null;
  name:       string;
  size?:      AvatarSize;
  shape?:     'circle' | 'square';
  className?: string;
}

export function Avatar({
  src,
  name,
  size = 'md',
  shape = 'circle',
  className,
}: AvatarProps) {
  const fallback = avatarUrl(name, PIXELS[size]);

  return (
    <img
      src={src || fallback}
      alt={name}
      onError={(e) => {
        const img = e.currentTarget;
        // Guard against a loop if the fallback host itself is unreachable.
        if (img.src !== fallback) img.src = fallback;
      }}
      className={cn(
        'object-cover bg-surface-alt ring-1 ring-border-dim shrink-0',
        shape === 'circle' ? 'rounded-full' : 'rounded-card',
        SIZES[size],
        className
      )}
    />
  );
}

/* ─── AvatarStack ───────────────────────────────────────────────────────────
 * Overlapping row for social proof (homepage trust badge, review clusters).
 * Overflow past `max` collapses into a +N chip sized to match.
 * ────────────────────────────────────────────────────────────────────────── */

export interface AvatarStackProps {
  people:     { src?: string | null; name: string }[];
  max?:       number;
  size?:      AvatarSize;
  className?: string;
}

export function AvatarStack({
  people,
  max = 4,
  size = 'sm',
  className,
}: AvatarStackProps) {
  const shown    = people.slice(0, max);
  const overflow = people.length - shown.length;

  return (
    <div className={cn('flex items-center -space-x-2', className)}>
      {shown.map((p, i) => (
        <Avatar
          key={`${p.name}-${i}`}
          src={p.src}
          name={p.name}
          size={size}
          className="ring-2 ring-card"
        />
      ))}

      {overflow > 0 && (
        <span
          className={cn(
            'flex items-center justify-center rounded-full shrink-0',
            'bg-surface-alt text-ink-sub font-bold ring-2 ring-card',
            size === 'xs' || size === 'sm' ? 'text-3xs' : 'text-2xs',
            SIZES[size]
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
