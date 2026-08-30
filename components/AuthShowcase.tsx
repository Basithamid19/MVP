'use client';

import React from 'react';
import { ShieldCheck, Star } from 'lucide-react';
import { AvatarStack } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';

/* ─── AuthShowcase ──────────────────────────────────────────────────────────
 * The shared right-hand panel for every auth screen (login, register, verify,
 * forgot-password, reset-password). Replaces the five identical empty 600px
 * white circles that were the most template-looking artifact in the app.
 *
 * Reuses the homepage visual language — dot-grid canvas, a category-tinted
 * photo card, and two floating proof chips — so signing up feels like the
 * same product as the marketing page. Copy is per-page: each caller passes
 * its own title/subtitle so the panel never parrots the left column.
 *
 * NOTE: images.unsplash.com is deliberately NOT in next.config.ts
 * remotePatterns (same as HomePageClient), so this is a plain <img> with
 * explicit width/height and a picsum onError fallback, not next/image.
 * ────────────────────────────────────────────────────────────────────────── */

/* Distinct from every photo used on the homepage. */
const SHOWCASE_PHOTO =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop';
const SHOWCASE_FALLBACK = 'https://picsum.photos/seed/aladdin-auth/1000/1250';

/* Initials avatars from the shared palette — no stock faces anywhere. */
const SHOWCASE_FACES = [
  { name: 'Rūta B.' },
  { name: 'Tomas J.' },
  { name: 'Eglė M.' },
];

export interface AuthShowcaseProps {
  title: string;
  subtitle: string;
}

export default function AuthShowcase({ title, subtitle }: AuthShowcaseProps) {
  const t = useTranslation();

  return (
    <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] [background-size:40px_40px] opacity-50" />

      <div className="relative w-full max-w-md px-8 py-12">
        <div className="relative">
          {/* Category-tinted photo card, tipped slightly off-axis */}
          <div className="rotate-[-2deg]">
            <div className="rounded-hero bg-cat-cleaning p-3 border border-border-dim/50 shadow-float">
              <img
                src={SHOWCASE_PHOTO}
                alt=""
                aria-hidden="true"
                width={1000}
                height={1250}
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.src !== SHOWCASE_FALLBACK) img.src = SHOWCASE_FALLBACK;
                }}
                className="w-full aspect-[4/5] object-cover rounded-panel bg-surface-alt"
              />
            </div>
          </div>

          {/* Floating proof — verification chip */}
          <div className="absolute -bottom-5 -left-5 bg-card/85 backdrop-blur border border-border-dim/60 rounded-card shadow-float px-4 py-3 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-brand shrink-0" />
            <div>
              <p className="text-xs font-bold text-ink leading-tight">{t.hero.verified}</p>
              <p className="text-3xs font-semibold uppercase tracking-wider text-ink-dim">
                {t.trustBanner.verifiedTitle}
              </p>
            </div>
          </div>

          {/* Floating proof — social/rating chip */}
          <div className="absolute -top-5 -right-5 bg-card/85 backdrop-blur border border-border-dim/60 rounded-card shadow-float px-3.5 py-2.5 flex items-center gap-2.5">
            <AvatarStack people={SHOWCASE_FACES} size="xs" />
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-caution fill-caution shrink-0" />
              <span className="text-3xs font-semibold uppercase tracking-wider text-ink-dim">
                {t.hero.topRated}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-14">
          <h2 className="text-3xl font-bold tracking-tight text-ink">{title}</h2>
          <p className="mt-3 text-ink-sub leading-relaxed">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
