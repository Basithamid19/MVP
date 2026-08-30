'use client';

import React from 'react';
import Link from 'next/link';
import {
  Star, ShieldCheck, Clock,
  Sparkles, Droplets, Zap, Hammer, Truck, Package, Wrench,
} from 'lucide-react';
import { Avatar } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Dictionary } from '@/lib/i18n';

/* ─── ProviderCard ──────────────────────────────────────────────────────────
 * THE provider card. One component, two presentations:
 *   size="row"  → horizontal list row (browse results, category page)
 *   size="tile" → vertical card with a category-tinted header band (grids,
 *                 rails, carousels)
 *
 * Takes the /api/providers list shape (BROWSE_SELECT) and degrades cleanly
 * when the richer single-provider fields (offerings, _count) are absent —
 * the list endpoint does not return offerings, so the price anchor simply
 * does not render there.
 *
 * All copy comes from the `t` dictionary the page already holds
 * (`useTranslation()`), so the card never owns strings of its own.
 *
 * Usage:
 *   <ProviderCard provider={p} t={t} />
 *   <ProviderCard provider={p} t={t} size="tile" />
 * ────────────────────────────────────────────────────────────────────────── */

/* Category tint + mark. Keyed on the real category slugs seeded in
   prisma/seed.ts, with the token slug names aliased in so a renamed or
   imported category still lands on its tint. Mirrors the mapping the
   provider profile cover uses; exported here so browse / category / any
   future surface share one table instead of re-declaring it. */
export const CATEGORY_THEME: Record<string, { bg: string; ink: string; Icon: React.ElementType }> = {
  cleaning:             { bg: 'bg-cat-cleaning',   ink: 'text-cat-cleaning-ink',   Icon: Sparkles },
  plumber:              { bg: 'bg-cat-plumbing',   ink: 'text-cat-plumbing-ink',   Icon: Droplets },
  plumbing:             { bg: 'bg-cat-plumbing',   ink: 'text-cat-plumbing-ink',   Icon: Droplets },
  electrician:          { bg: 'bg-cat-electrical', ink: 'text-cat-electrical-ink', Icon: Zap },
  electrical:           { bg: 'bg-cat-electrical', ink: 'text-cat-electrical-ink', Icon: Zap },
  handyman:             { bg: 'bg-cat-repairs',    ink: 'text-cat-repairs-ink',    Icon: Hammer },
  repairs:              { bg: 'bg-cat-repairs',    ink: 'text-cat-repairs-ink',    Icon: Hammer },
  'moving-help':        { bg: 'bg-cat-logistics',  ink: 'text-cat-logistics-ink',  Icon: Truck },
  logistics:            { bg: 'bg-cat-logistics',  ink: 'text-cat-logistics-ink',  Icon: Truck },
  'furniture-assembly': { bg: 'bg-cat-assembly',   ink: 'text-cat-assembly-ink',   Icon: Package },
  assembly:             { bg: 'bg-cat-assembly',   ink: 'text-cat-assembly-ink',   Icon: Package },
};

export const FALLBACK_CATEGORY_THEME = {
  bg: 'bg-brand-muted', ink: 'text-brand-dark', Icon: Wrench,
};

/** Tint + mark for a category slug. Unknown / missing slugs get the brand tint. */
export function categoryTheme(slug?: string | null) {
  return (slug && CATEGORY_THEME[slug]) || FALLBACK_CATEGORY_THEME;
}

/* Shared surface treatment — one card language, one hover. */
const CARD_BASE =
  'group block bg-card rounded-card border border-border-dim shadow-card ' +
  'hover:shadow-elevated hover:-translate-y-0.5 hover:border-brand/30 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 ' +
  'transition-all duration-150';

export interface ProviderCardProps {
  /** A row from `GET /api/providers` (list or single shape). */
  provider:   any;
  /** The page's dictionary — `useTranslation()`. */
  t:          Dictionary;
  size?:      'row' | 'tile';
  className?: string;
}

export function ProviderCard({
  provider,
  t,
  size = 'row',
  className,
}: ProviderCardProps) {
  const name         = provider.user?.name ?? t.providerProfile.professionalFallback;
  const primaryCat   = provider.categories?.[0] ?? null;
  const theme        = categoryTheme(primaryCat?.slug);
  const CatMark      = theme.Icon;
  const categoryName = primaryCat?.name ?? t.providerProfile.professionalFallback;

  // "usually responds in 2 hours" → "2 hours" — the label already says it.
  const responseTime = provider.responseTime
    ? String(provider.responseTime).replace(/^usually responds in\s*/i, '')
    : null;

  // Price anchor — cheapest real offering price, when the payload carries
  // offerings (single-provider fetch). Absent on the browse list endpoint.
  const offeringPrices = ((provider.offerings ?? []) as any[])
    .map((o) => Number(o?.price))
    .filter((n) => !isNaN(n) && n > 0);
  const fromPrice = offeringPrices.length ? Math.min(...offeringPrices) : null;

  const rating = typeof provider.ratingAvg === 'number' ? provider.ratingAvg.toFixed(1) : '—';
  const jobs   = provider.completedJobs ?? 0;

  const bio = provider.bio && provider.bio.trim().length >= 20
    ? provider.bio
    : `${provider.categories?.map((c: any) => c.name).join(', ') || t.providerProfile.professionalFallback}` +
      ` ${t.providerProfile.inArea} ${provider.serviceArea || 'Vilnius'}`;

  const verifiedMark = provider.isVerified ? (
    <ShieldCheck
      className="w-3.5 h-3.5 text-trust shrink-0"
      aria-label={t.common.verified}
    />
  ) : null;

  const ratingRow = (
    <div className="flex items-center gap-1 text-2xs min-w-0">
      <Star className="w-3 h-3 text-caution fill-caution shrink-0" />
      <span className="font-bold text-ink">{rating}</span>
      <span className="text-ink-dim truncate">· {jobs} {t.meetPros.jobs}</span>
    </div>
  );

  const priceAnchor = fromPrice != null ? (
    <div className="shrink-0 text-right leading-tight">
      <p className="text-3xs font-bold uppercase tracking-widest text-ink-dim">
        {t.providerProfile.priceFrom}
      </p>
      <p className="text-sm font-bold text-ink">€{fromPrice}</p>
    </div>
  ) : null;

  const categoryChip = (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-chip text-3xs font-bold shrink-0',
        theme.bg, theme.ink
      )}
    >
      <CatMark className="w-3 h-3" strokeWidth={2} />
      {categoryName}
    </span>
  );

  /* ── tile ─────────────────────────────────────────────────────────────── */
  if (size === 'tile') {
    return (
      <Link
        href={`/providers/${provider.id}`}
        className={cn(CARD_BASE, 'overflow-hidden', className)}
      >
        {/* Tinted header band — the profile cover strip, in miniature */}
        <div className={cn('relative h-16', theme.bg)}>
          <CatMark
            className={cn('absolute right-3 top-2 w-12 h-12 opacity-25', theme.ink)}
            strokeWidth={1.25}
            aria-hidden="true"
          />
          <Avatar
            src={provider.user?.image}
            name={name}
            size="lg"
            shape="square"
            className="absolute -bottom-5 left-4 ring-4 ring-card"
          />
        </div>

        <div className="pt-7 px-4 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <h3 className="font-bold text-sm text-ink leading-tight truncate">{name}</h3>
                {verifiedMark}
              </div>
              <div className="mt-1">{ratingRow}</div>
            </div>
            {priceAnchor}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
            {categoryChip}
            {responseTime && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-chip bg-surface-alt text-ink-sub text-3xs font-semibold">
                <Clock className="w-2.5 h-2.5 shrink-0" />
                {responseTime}
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  /* ── row (default) ────────────────────────────────────────────────────── */
  return (
    <Link
      href={`/providers/${provider.id}`}
      className={cn(CARD_BASE, 'flex gap-3.5 p-3.5 sm:p-4 items-start', className)}
    >
      <Avatar src={provider.user?.image} name={name} size="md" shape="square" />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="font-bold text-sm text-ink leading-tight truncate">{name}</h3>
              {verifiedMark}
            </div>

            <div className="flex items-center gap-2 flex-wrap mt-1">
              {ratingRow}
              {responseTime && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-chip bg-surface-alt text-ink-sub text-3xs font-semibold">
                  <Clock className="w-2.5 h-2.5 shrink-0" />
                  {responseTime}
                </span>
              )}
            </div>
          </div>

          {priceAnchor}
        </div>

        <p className="text-2xs text-ink-sub leading-relaxed line-clamp-1 mt-1.5">{bio}</p>

        <div className="mt-2">{categoryChip}</div>
      </div>
    </Link>
  );
}

export default ProviderCard;
