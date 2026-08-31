'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

/* ─── ProviderWorkTabs ──────────────────────────────────────────────────────
 * Mobile-only tab strip linking the three provider work surfaces. The sidebar
 * rail is hidden below md, so Leads / Jobs / My Quotes must all be reachable
 * from each other here. ONE component — the strip previously existed as three
 * divergent copies (jobs had 3 tabs, leads had 2, quotes had none).
 * ────────────────────────────────────────────────────────────────────────── */

export type ProviderWorkTab = 'leads' | 'jobs' | 'quotes';

export function ProviderWorkTabs({ active }: { active: ProviderWorkTab }) {
  const t = useTranslation();

  const TABS: { id: ProviderWorkTab; href: string; label: string }[] = [
    { id: 'leads',  href: '/provider/leads',  label: t.providerNav.leads },
    { id: 'jobs',   href: '/provider/jobs',   label: t.providerNav.jobs },
    { id: 'quotes', href: '/provider/quotes', label: t.providerNav.myQuotes },
  ];

  return (
    <nav className="md:hidden flex gap-1 p-1 bg-surface-alt rounded-card border border-border-dim mb-5">
      {TABS.map(tab =>
        tab.id === active ? (
          <span
            key={tab.id}
            aria-current="page"
            className="flex-1 py-2.5 rounded-input text-sm font-semibold text-center bg-card text-brand shadow-card"
          >
            {tab.label}
          </span>
        ) : (
          <Link
            key={tab.id}
            href={tab.href}
            className="flex-1 py-2.5 rounded-input text-sm font-medium text-center text-ink-sub hover:text-ink transition-colors"
          >
            {tab.label}
          </Link>
        ),
      )}
    </nav>
  );
}
