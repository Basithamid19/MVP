'use client';

import { AladdinIcon } from '@/components/icons';
import React from 'react';
import Link from 'next/link';
import MobileNav from '@/components/MobileNav';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import CustomerMenuDrawer from '@/components/CustomerMenuDrawer';
import NotificationBell from '@/components/NotificationBell';

interface CustomerLayoutProps {
  children: React.ReactNode;
  /** Max width of the padded content column. Ignored when `flush`. */
  maxWidth?: string;
  /**
   * Drop the padded, width-capped <main> wrapper and hand the page the raw
   * scroll area. For full-bleed / full-height surfaces (the messages
   * inbox + chat split) that manage their own containers.
   */
  flush?: boolean;
}

export default function CustomerLayout({
  children,
  maxWidth = 'max-w-5xl',
  flush = false,
}: CustomerLayoutProps) {
  return (
    <div className="min-h-screen w-full max-w-full bg-canvas flex font-sans">
      {/* Main area */}
      <div className="flex-1 min-w-0 overflow-x-hidden flex flex-col pb-20 md:pb-0">
        {/* Top bar — canonical sticky-header recipe (shared with provider shell) */}
        <header className="sticky top-0 z-30 bg-canvas/80 backdrop-blur-xl border-b border-border-dim/50">
          <div className="px-5 sm:px-8 h-14 sm:h-16 flex items-center justify-between">
            {/* Left: hamburger (desktop) + brand */}
            <div className="flex items-center gap-2">
              <CustomerMenuDrawer />
              <Link href="/" className="md:hidden flex items-center gap-2">
                <div className="w-8 h-8 bg-brand rounded-input flex items-center justify-center shadow-card">
                  <AladdinIcon className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-lg tracking-tight text-ink">Aladdin</span>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Page content */}
        {flush ? (
          <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
        ) : (
          <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 sm:px-6 pb-24 lg:px-10 lg:pb-10 pt-2 lg:pt-4">
            <div className={`${maxWidth} mx-auto`}>{children}</div>
          </main>
        )}

        <MobileNav />
      </div>
    </div>
  );
}
