'use client';

import Link from 'next/link';
import { AladdinIcon } from '@/components/icons';
import { buttonVariants } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';

/* ─── SiteNav ───────────────────────────────────────────────────────────────
 * Canonical marketing/legal nav. Replaces five divergent hand-rolled copies
 * (about, for-pros, terms, privacy, support) that ran two different heights,
 * two blur recipes and raw `bg-white/90`.
 *
 * These pages are public and unauthenticated, so the right side is static:
 * language switch + log in (ghost) + primary CTA. Pass `ctaLabel` when the
 * page has a more specific call to action (e.g. "Join as a Pro").
 * ────────────────────────────────────────────────────────────────────────── */

export interface SiteNavProps {
  /** Overrides the default "Sign up" CTA label. */
  ctaLabel?: string;
  /** Overrides the default /register CTA target. */
  ctaHref?:  string;
}

export default function SiteNav({ ctaLabel, ctaHref = '/register' }: SiteNavProps) {
  const t = useTranslation();

  return (
    <nav className="sticky top-0 z-30 bg-canvas/80 backdrop-blur-xl border-b border-border-dim/50">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 h-14 sm:h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 bg-brand rounded-input flex items-center justify-center shrink-0">
            <AladdinIcon className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-ink truncate">Aladdin</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            {t.nav.logIn}
          </Link>
          <Link href={ctaHref} className={buttonVariants({ variant: 'primary', size: 'sm' })}>
            {ctaLabel ?? t.nav.signUp}
          </Link>
        </div>
      </div>
    </nav>
  );
}
