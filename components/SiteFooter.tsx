'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

/* ─── SiteFooter ────────────────────────────────────────────────────────────
 * Canonical marketing/legal footer. Replaces five hand-rolled copies that
 * carried FOUR different link sets between them — and none of which linked
 * /about or /for-pros.
 *
 * One link set, everywhere. Every href resolves to a real page or a real
 * anchor (see the /for-pros#how-it-works note below).
 * ────────────────────────────────────────────────────────────────────────── */

export default function SiteFooter() {
  const t = useTranslation();

  const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
    {
      heading: t.footer.forCustomers,
      links: [
        { label: t.footer.browseServices,      href: '/browse' },
        { label: t.heroCard.postRequestTitle,  href: '/requests/new' },
      ],
    },
    {
      heading: t.footer.forProfessionals,
      links: [
        { label: t.footer.joinAsAPro, href: '/for-pros' },
        // The only live "how it works" anchor in the app lives on /for-pros.
        { label: t.footer.howItWorks, href: '/for-pros#how-it-works' },
      ],
    },
    {
      heading: t.footer.company,
      links: [
        { label: t.footer.about,   href: '/about' },
        { label: t.footer.support, href: '/support' },
        { label: t.footer.terms,   href: '/terms' },
        { label: t.footer.privacy, href: '/privacy' },
      ],
    },
  ];

  return (
    <footer className="bg-canvas border-t border-border-dim">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-14">

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-10">
          {COLUMNS.map(({ heading, links }) => (
            <div key={heading}>
              <h2 className="text-2xs font-bold uppercase tracking-widest text-ink-dim mb-4">
                {heading}
              </h2>
              <ul className="space-y-3 text-sm">
                {links.map(({ label, href }) => (
                  <li key={href}>
                    <Link href={href} className="text-ink-sub hover:text-ink transition-colors duration-150">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-border-dim flex flex-col-reverse sm:flex-row items-center justify-between">
          <p className="text-xs text-ink-dim">&copy; 2026 {t.footer.copyright}</p>
        </div>

      </div>
    </footer>
  );
}
