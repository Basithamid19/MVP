'use client';

import { AladdinIcon } from '@/components/icons';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard, Inbox, Briefcase, DollarSign,
  BarChart2, Settings, LifeBuoy, LogOut, ShieldCheck,
  MessageSquare, FileText,
} from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import MobileNav from '@/components/MobileNav';
import NotificationBell from '@/components/NotificationBell';
import { useTranslation } from '@/lib/i18n';

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useTranslation();

  // Inside the component so labels re-render on locale change.
  const NAV_GROUPS = [
    {
      label: t.providerNav.overview,
      items: [
        { href: '/provider/dashboard', label: t.providerNav.dashboard, icon: LayoutDashboard },
      ],
    },
    {
      label: t.providerNav.work,
      items: [
        { href: '/provider/leads',    label: t.providerNav.leads,    icon: Inbox },
        { href: '/provider/quotes',   label: t.providerNav.myQuotes, icon: FileText },
        { href: '/provider/jobs',     label: t.providerNav.jobs,     icon: Briefcase },
        { href: '/messages',          label: t.providerNav.messages, icon: MessageSquare },
      ],
    },
    {
      label: t.providerNav.business,
      items: [
        { href: '/provider/earnings',    label: t.providerNav.earnings,    icon: DollarSign },
        { href: '/provider/performance', label: t.providerNav.performance, icon: BarChart2 },
      ],
    },
    {
      label: t.providerNav.account,
      items: [
        { href: '/provider/settings', label: t.providerNav.settings, icon: Settings },
        { href: '/provider/disputes', label: t.providerNav.support,  icon: LifeBuoy },
      ],
    },
  ];

  if (pathname?.startsWith('/provider/onboarding')) return <>{children}</>;

  return (
    <div className="min-h-screen bg-canvas flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-16 lg:w-64 bg-canvas flex-col sticky top-0 h-screen shrink-0 border-r border-border-dim/50">
        <div className="p-6 lg:p-8">
          <Link href="/provider/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand rounded-input flex items-center justify-center shrink-0 shadow-card">
              <AladdinIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-ink hidden lg:block">Aladdin</span>
          </Link>
        </div>

        <nav className="flex-1 px-2 lg:px-4 py-4 space-y-4 lg:space-y-6 overflow-y-auto">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label}>
              {/* Icon-rail state (md–lg) shows a hairline divider instead of the
                  label so the groups don't read as unexplained gaps. */}
              <p className="text-3xs font-bold text-ink-dim uppercase tracking-widest hidden lg:block px-4 mb-2">
                {group.label}
              </p>
              {gi > 0 && <div className="lg:hidden border-t border-border-dim mx-3 mb-3" />}
              <div className="space-y-1">
                {group.items.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || pathname?.startsWith(href + '/');
                  return (
                    <Link
                      key={href}
                      href={href}
                      title={label}
                      className={`flex items-center justify-center lg:justify-start gap-3 px-3 lg:px-4 py-3 rounded-input font-medium text-sm transition-all ${
                        active ? 'bg-card shadow-card border border-border-dim text-brand' : 'text-ink-sub hover:text-ink hover:bg-card/60 border border-transparent'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="hidden lg:block">{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-2 lg:p-6 space-y-1">
          <Link
            href="/provider/verification"
            title={t.providerNav.verification}
            className="flex items-center justify-center lg:justify-start gap-3 px-3 lg:px-4 py-3 rounded-input text-sm font-medium text-ink-sub hover:text-ink hover:bg-card/60 transition-all"
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="hidden lg:block">{t.providerNav.verification}</span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            title={t.providerNav.logOut}
            className="w-full flex items-center justify-center lg:justify-start gap-3 px-3 lg:px-4 py-3 rounded-input text-sm font-medium text-ink-dim hover:text-danger hover:bg-danger-surface transition-all"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="hidden lg:block">{t.providerNav.logOut}</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar — canonical sticky-header recipe (shared with CustomerLayout) */}
        <header className="sticky top-0 z-30 bg-canvas/80 backdrop-blur-xl border-b border-border-dim/50">
          <div className="px-5 sm:px-8 h-14 sm:h-16 flex items-center justify-between sm:justify-end gap-2">
            <Link href="/provider/dashboard" className="md:hidden flex items-center gap-2">
              <div className="w-8 h-8 bg-brand rounded-input flex items-center justify-center shadow-card">
                <AladdinIcon className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-lg tracking-tight text-ink">Aladdin</span>
            </Link>

            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Standard provider page container — pages no longer set their own
            outer padding/width. `pb-nav` clears the fixed MobileNav below md. */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-nav md:pb-8">
            {children}
          </div>
        </main>

        {/* ══ Mobile Bottom Navigation ════════════════════════════════════════ */}
        <MobileNav />
      </div>
    </div>
  );
}
