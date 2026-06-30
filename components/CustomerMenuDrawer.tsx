'use client';

import { AladdinIcon } from '@/components/icons';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Menu, X, Home, Search, MessageCircle, LayoutDashboard, Users, LogOut, LogIn,
} from 'lucide-react';

// Mirrors the customer nav set — adds Messages (the old CustomerLayout sidebar
// was missing it). `authOnly` items are hidden for logged-out guests.
const NAV_ITEMS = [
  { href: '/',          label: 'Home',       Icon: Home,            match: (p: string) => p === '/' },
  { href: '/browse',    label: 'Find Pros',  Icon: Search,          match: (p: string) => p === '/browse' || p.startsWith('/providers') },
  { href: '/messages',  label: 'Messages',   Icon: MessageCircle,   match: (p: string) => p.startsWith('/messages'),                                              authOnly: true },
  { href: '/dashboard', label: 'Dashboard',  Icon: LayoutDashboard, match: (p: string) => p === '/dashboard' || p.startsWith('/bookings') || p.startsWith('/requests'), authOnly: true },
  { href: '/account',   label: 'My Account', Icon: Users,           match: (p: string) => p === '/account',                                                        authOnly: true },
];

// Routes that get their own navigation (providers/admin) or are intentionally
// chrome-free (auth screens, the focused request wizard).
const HIDDEN_PREFIXES = ['/provider', '/admin', '/login', '/register', '/requests/new'];

export default function CustomerMenuDrawer({ className = '' }: { className?: string }) {
  const pathname = usePathname() ?? '';
  const { data: session, status } = useSession();
  const role = (session?.user as any)?.role;
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Close on navigation
  useEffect(() => { setOpen(false); }, [pathname]);

  // Close on Escape + lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Don't render for providers/admins or on excluded routes.
  if (status === 'loading') return null;
  if (role === 'PROVIDER' || role === 'ADMIN') return null;
  if (HIDDEN_PREFIXES.some(pre => pathname === pre || pathname.startsWith(pre + '/'))) return null;

  const items = NAV_ITEMS.filter(item => !item.authOnly || session);

  // Overlay + panel are portalled to <body> so a page header's backdrop-blur /
  // transform ancestor can't trap the fixed positioning.
  const drawer = (
    <>
      <div
        onClick={() => setOpen(false)}
        className={`hidden md:block fixed inset-0 bg-ink/40 backdrop-blur-[2px] z-[60] transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      <aside
        className={`hidden md:flex fixed top-0 left-0 h-full w-72 bg-canvas z-[60] flex-col border-r border-border-dim shadow-float transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!open}
      >
        {/* Logo + close */}
        <div className="flex items-center justify-between p-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center shrink-0 shadow-sm">
              <AladdinIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-ink">Aladdin</span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="w-9 h-9 flex items-center justify-center rounded-full text-ink-dim hover:text-ink hover:bg-white/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
          {items.map(({ href, label, Icon, match }) => {
            const active = match(pathname);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                  active
                    ? 'bg-white shadow-sm border border-border-dim text-brand'
                    : 'text-ink-sub hover:text-ink hover:bg-white/60 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Auth action */}
        <div className="p-4">
          {session ? (
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ink-dim hover:text-danger hover:bg-danger-surface transition-all"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Log Out</span>
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-brand hover:bg-brand-muted transition-all"
            >
              <LogIn className="w-4 h-4 shrink-0" />
              <span>Log In</span>
            </Link>
          )}
        </div>
      </aside>
    </>
  );

  return (
    <>
      {/* Hamburger trigger — desktop only (mobile keeps the bottom MobileNav) */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className={`hidden md:inline-flex w-10 h-10 items-center justify-center rounded-xl text-ink-sub hover:text-ink hover:bg-white/60 border border-transparent hover:border-border-dim transition-all shrink-0 ${className}`}
      >
        <Menu className="w-5 h-5" />
      </button>

      {mounted ? createPortal(drawer, document.body) : null}
    </>
  );
}
