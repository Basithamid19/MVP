'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { AladdinIcon } from '@/components/icons';
import { buttonVariants } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';

/* ─── SiteNav ───────────────────────────────────────────────────────────────
 * Canonical marketing/legal nav. Replaces five divergent hand-rolled copies
 * (about, for-pros, terms, privacy, support) that ran two different heights,
 * two blur recipes and raw `bg-white/90`.
 *
 * These pages are public — reachable signed in or out — so the right side is
 * session-aware: a guest gets log in (ghost) + primary CTA, a signed-in user
 * gets a single primary link into their own console. Rendering the guest CTAs
 * unconditionally made /support (Help Centre) look logged-out to a logged-in
 * user. Pass `ctaLabel` when the page has a more specific guest call to action
 * (e.g. "Join as a Pro").
 * ────────────────────────────────────────────────────────────────────────── */

const HOME_BY_ROLE: Record<string, string> = {
  CUSTOMER: '/dashboard',
  PROVIDER: '/provider/dashboard',
  ADMIN:    '/admin/dashboard',
};

export interface SiteNavProps {
  /** Overrides the default "Sign up" CTA label. */
  ctaLabel?: string;
  /** Overrides the default /register CTA target. */
  ctaHref?:  string;
}

export default function SiteNav({ ctaLabel, ctaHref = '/register' }: SiteNavProps) {
  const t = useTranslation();
  const { data: session, status } = useSession();
  // 'loading' keeps the guest CTAs so the nav never collapses mid-render; a
  // transient session-fetch failure degrades to the public view, not a blank.
  const signedIn = status === 'authenticated' && !!session?.user;
  const home = HOME_BY_ROLE[(session?.user as any)?.role] ?? '/dashboard';

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
          {signedIn ? (
            <Link href={home} className={buttonVariants({ variant: 'primary', size: 'sm' })}>
              {t.nav.dashboard}
            </Link>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                {t.nav.logIn}
              </Link>
              <Link href={ctaHref} className={buttonVariants({ variant: 'primary', size: 'sm' })}>
                {ctaLabel ?? t.nav.signUp}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
