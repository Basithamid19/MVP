'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { LogOut, Menu, ShieldAlert, X } from 'lucide-react';
import { AladdinIcon } from '@/components/icons';
import { Button, buttonVariants, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';

import { MODULES, type AdminModuleId } from '../components/modules';
import { AnalyticsModule }     from '../modules/analytics';
import { VerificationsModule } from '../modules/verifications';
import { ProvidersModule }     from '../modules/providers';
import { BookingsModule }      from '../modules/bookings';
import { DisputesModule }      from '../modules/disputes';
import { ReviewsModule }       from '../modules/reviews';
import { CategoriesModule }    from '../modules/categories';
import { CRMModule }           from '../modules/crm';
import { IncidentModule }      from '../modules/incidents';

/* ─── Admin shell ───────────────────────────────────────────────────────────
 * Auth gate + navigation only. Every module lives in app/admin/modules and
 * owns its own data fetching, exactly as it did inside the old monolith.
 * Admin is an internal English-only tool — no i18n dictionary is wired here.
 * ────────────────────────────────────────────────────────────────────────── */

const MODULE_COMPONENTS: Record<AdminModuleId, React.ComponentType> = {
  analytics:     AnalyticsModule,
  verifications: VerificationsModule,
  providers:     ProvidersModule,
  bookings:      BookingsModule,
  disputes:      DisputesModule,
  reviews:       ReviewsModule,
  categories:    CategoriesModule,
  crm:           CRMModule,
  incidents:     IncidentModule,
};

function NavList({
  active,
  onSelect,
  itemClassName,
}: {
  active:         string;
  onSelect:       (id: AdminModuleId) => void;
  itemClassName?: string;
}) {
  return (
    <>
      {MODULES.map(m => (
        <button
          key={m.id}
          type="button"
          onClick={() => onSelect(m.id)}
          aria-current={active === m.id ? 'page' : undefined}
          className={cn(
            'w-full flex items-center gap-3 px-4 rounded-input text-sm font-medium text-left border',
            'transition-all duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2',
            active === m.id
              ? 'bg-card shadow-card border-border-dim text-brand'
              : 'border-transparent text-ink-sub hover:text-ink hover:bg-card/60',
            itemClassName ?? 'py-3'
          )}
        >
          <m.icon className="w-4 h-4 shrink-0" />
          {m.label}
        </button>
      ))}
    </>
  );
}

function Brand({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-8 h-8 bg-brand rounded-input flex items-center justify-center shadow-card shrink-0">
        <AladdinIcon className="w-5 h-5 text-white" />
      </span>
      <span className={compact ? 'block' : undefined}>
        <span className="font-semibold text-base sm:text-lg tracking-tight text-ink block">Aladdin</span>
        <span className="text-3xs font-bold text-ink-dim uppercase tracking-widest">Admin Panel</span>
      </span>
    </div>
  );
}

export default function AdminDashboard() {
  const [active, setActive]     = useState<AdminModuleId>('analytics');
  const [forbidden, setForbidden] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    fetch('/api/admin?section=overview').then(r => {
      if (r.status === 403) setForbidden(true);
    });
  }, []);

  if (forbidden) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
        <EmptyState
          icon={ShieldAlert}
          size="lg"
          title="Access denied"
          description="This console is restricted to marketplace administrators. Sign in with an admin account to continue."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link href="/" className={buttonVariants({ variant: 'primary', size: 'md' })}>
                Back to Aladdin
              </Link>
              <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'md' })}>
                Log in
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  const activeModule = MODULES.find(m => m.id === active) ?? MODULES[0];
  const ActiveComponent = MODULE_COMPONENTS[active] ?? AnalyticsModule;

  return (
    <div className="min-h-screen bg-canvas flex">
      {/* ── Desktop rail ─────────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-64 shrink-0 bg-canvas border-r border-border-dim/50 flex-col sticky top-0 h-screen">
        <div className="p-8 pb-6">
          <Brand />
        </div>

        <nav aria-label="Admin modules" className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          <NavList active={active} onSelect={setActive} />
        </nav>

        <div className="p-6">
          <Button
            variant="ghost"
            className="w-full justify-start px-4 py-3 rounded-input font-medium hover:text-danger hover:bg-danger-surface"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            <LogOut className="w-4 h-4 shrink-0" /> Log Out
          </Button>
        </div>
      </aside>

      {/* ── Mobile drawer ────────────────────────────────────────────────── */}
      {showMobileMenu && (
        <div
          aria-hidden="true"
          className="md:hidden fixed inset-0 bg-ink/40 backdrop-blur-sm z-40"
          onClick={() => setShowMobileMenu(false)}
        />
      )}

      <aside
        className={cn(
          'md:hidden fixed top-0 left-0 h-full w-72 bg-canvas z-50 flex flex-col shadow-float',
          'transition-transform duration-250 [transition-timing-function:var(--ease-out-quart)]',
          showMobileMenu ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-6 flex items-center justify-between border-b border-border-dim">
          <Brand compact />
          <Button
            variant="ghost"
            size="sm"
            aria-label="Close menu"
            className="rounded-input"
            onClick={() => setShowMobileMenu(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav aria-label="Admin modules" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavList
            active={active}
            onSelect={id => { setActive(id); setShowMobileMenu(false); }}
            itemClassName="py-3.5"
          />
        </nav>

        <div className="p-4 border-t border-border-dim">
          <Button
            variant="ghost"
            className="w-full justify-start px-4 py-3.5 rounded-input font-medium hover:text-danger hover:bg-danger-surface"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            <LogOut className="w-4 h-4 shrink-0" /> Log Out
          </Button>
        </div>
      </aside>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="md:hidden sticky top-0 z-30 bg-canvas/80 backdrop-blur-xl border-b border-border-dim/50 px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Open menu"
            className="rounded-input"
            onClick={() => setShowMobileMenu(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <activeModule.icon className="w-4 h-4 text-brand shrink-0" />
            <span className="font-semibold text-sm text-ink truncate">{activeModule.label}</span>
          </div>
          <span className="w-8 h-8 bg-brand rounded-input flex items-center justify-center shadow-card shrink-0">
            <AladdinIcon className="w-4 h-4 text-white" />
          </span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
            <ActiveComponent />
          </div>
        </main>
      </div>
    </div>
  );
}
