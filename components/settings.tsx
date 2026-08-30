'use client';

/* ─── Shared settings primitives ────────────────────────────────────────────
 * `Section`, `SettingsRow` and the brand `HeroCard` were copy-pasted (with
 * the inline radial-gradient style duplicated verbatim) in both
 * app/account/AccountClient.tsx and app/provider/settings/page.tsx.
 * One implementation, token-only, used by both.
 * ────────────────────────────────────────────────────────────────────────── */

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Section ───────────────────────────────────────────────────────────────
 * Eyebrow label + a single hairline-divided card of rows.
 * `id` is optional and powers the account page's desktop anchor nav.
 * ────────────────────────────────────────────────────────────────────────── */

export interface SectionProps {
  title:      string;
  id?:        string;
  className?: string;
  children:   React.ReactNode;
}

export function Section({ title, id, className, children }: SectionProps) {
  return (
    <div id={id} className={cn(id ? 'scroll-mt-24' : undefined, className)}>
      <p className="text-3xs font-bold text-ink-dim uppercase tracking-widest mb-2 px-0.5">
        {title}
      </p>
      <div className="bg-card rounded-card border border-border-dim shadow-card overflow-hidden divide-y divide-border-dim">
        {children}
      </div>
    </div>
  );
}

/* ─── SettingsRow ───────────────────────────────────────────────────────────
 * Icon + label (+ sub) row. Renders as a <Link> when `href` is given,
 * otherwise a <button>. `trailing` replaces the default chevron.
 * ────────────────────────────────────────────────────────────────────────── */

export interface SettingsRowProps {
  icon:      React.ElementType;
  label:     string;
  sub?:      string;
  href?:     string;
  onClick?:  () => void;
  muted?:    boolean;
  trailing?: React.ReactNode;
}

export function SettingsRow({
  icon: Icon,
  label,
  sub,
  href,
  onClick,
  muted,
  trailing,
}: SettingsRowProps) {
  const inner = (
    <div className="flex items-center gap-3 px-4 py-3 active:bg-surface-alt/50 transition-colors">
      <div
        className={cn(
          'w-8 h-8 rounded-input flex items-center justify-center shrink-0',
          muted ? 'bg-surface-alt' : 'bg-brand-muted'
        )}
      >
        <Icon className={cn('w-4 h-4', muted ? 'text-ink-dim' : 'text-brand')} strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-semibold', muted ? 'text-ink-sub' : 'text-ink')}>{label}</p>
        {sub && <p className="text-2xs text-ink-dim mt-0.5 leading-snug">{sub}</p>}
      </div>
      {trailing ?? <ChevronRight className="w-3.5 h-3.5 text-ink-dim/40 shrink-0" />}
    </div>
  );

  if (href) return <Link href={href} className="block">{inner}</Link>;
  return <button onClick={onClick} className="w-full text-left">{inner}</button>;
}

/* ─── HeroCard ──────────────────────────────────────────────────────────────
 * The brand-filled identity hero used at the top of both settings surfaces.
 * Owns the radial highlight so the inline style lives in exactly one place.
 * ────────────────────────────────────────────────────────────────────────── */

export interface HeroCardProps {
  className?: string;
  children:   React.ReactNode;
}

export function HeroCard({ className, children }: HeroCardProps) {
  return (
    <div className={cn('bg-brand rounded-card p-4 sm:p-5 relative overflow-hidden', className)}>
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }}
      />
      {children}
    </div>
  );
}
