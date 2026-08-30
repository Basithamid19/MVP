'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/* ─── Switch ────────────────────────────────────────────────────────────────
 * THE boolean toggle — a real animated switch with keyboard + screen-reader
 * semantics. Replaces both the lucide ToggleLeft/ToggleRight glyph swap and
 * per-page hand-built toggles.
 *
 * Usage:
 *   <Switch checked={instantBook} onChange={setInstantBook} label="Instant book" />
 * ────────────────────────────────────────────────────────────────────────── */

export interface SwitchProps {
  checked:    boolean;
  onChange:   (next: boolean) => void;
  /** Accessible name. Required unless the switch is labelled externally via aria-labelledby. */
  label?:     string;
  disabled?:  boolean;
  size?:      'sm' | 'md';
  className?: string;
}

export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'md',
  className,
}: SwitchProps) {
  const track = size === 'sm' ? 'w-8 h-5' : 'w-11 h-6';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex items-center rounded-full shrink-0',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        track,
        checked ? 'bg-brand' : 'bg-border',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'inline-block rounded-full bg-card shadow-card',
          'transition-transform duration-150 [transition-timing-function:var(--ease-out-quart)]',
          size === 'sm' ? 'w-3.5 h-3.5' : 'w-[18px] h-[18px]',
          'translate-x-[3px]',
          checked && (size === 'sm' ? 'translate-x-[15px]' : 'translate-x-[23px]'),
        )}
      />
    </button>
  );
}
