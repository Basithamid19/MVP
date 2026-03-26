'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import MobileNav from '@/components/MobileNav';
import {
  Home, Search, LayoutDashboard, Users, LogOut,
  Bell, Clock, Calendar, CheckCircle2, X,
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'quote' | 'booking' | 'status';
  title: string;
  body: string;
  time: string;
  href: string;
}

const NOTIF_ICON: Record<string, React.ElementType> = {
  quote: Users, booking: Calendar, status: CheckCircle2,
};
const NOTIF_COLOR: Record<string, string> = {
  quote:   'bg-trust-surface text-trust',
  booking: 'bg-trust-surface text-trust',
  status:  'bg-caution-surface text-caution',
};

function timeAgo(date: string) {
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const NAV_ITEMS = [
  { href: '/',          label: 'Home',       Icon: Home,            match: (p: string) => p === '/' },
  { href: '/browse',    label: 'Find Pros',  Icon: Search,          match: (p: string) => p === '/browse' || p.startsWith('/providers') },
  { href: '/dashboard', label: 'Dashboard',  Icon: LayoutDashboard, match: (p: string) => p === '/dashboard' || p.startsWith('/bookings') || p.startsWith('/requests') },
  { href: '/account',   label: 'My Account', Icon: Users,           match: (p: string) => p === '/account' },
];

interface CustomerLayoutProps {
  children: React.ReactNode;
  notifications?: Notification[];
  maxWidth?: string;
}

export default function CustomerLayout({
  children,
  notifications: externalNotifications,
  maxWidth = 'max-w-5xl',
}: CustomerLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [showNotifs, setShowNotifs] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (externalNotifications) {
      setNotifications(externalNotifications);
    }
  }, [externalNotifications]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
    };
    if (showNotifs) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifs]);

  const visibleNotifs = notifications.filter(n => !dismissed.has(n.id));
  const unreadCount = visibleNotifs.length;

  return (
    <div className="min-h-screen bg-canvas flex font-sans">
      {/* Sidebar */}
      <aside className="hidden md:flex w-16 lg:w-64 bg-canvas flex-col sticky top-0 h-screen shrink-0 border-r border-border-dim/50">
        <div className="p-6 lg:p-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-white font-bold text-sm tracking-tight">D</span>
            </div>
            <span className="font-semibold text-lg tracking-tight text-ink hidden lg:block">Dispatch</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, Icon, match }) => {
            const active = match(pathname);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                  active
                    ? 'bg-white shadow-sm border border-border-dim text-brand'
                    : 'text-ink-sub hover:text-ink hover:bg-white/60 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden lg:block">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 lg:p-6">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ink-dim hover:text-danger hover:bg-danger-surface transition-all"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="hidden lg:block">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 min-w-0 overflow-x-hidden flex flex-col pb-20 md:pb-0">
        {/* Top bar */}
        <header className="bg-canvas/80 backdrop-blur-xl px-5 sm:px-8 py-2 sm:py-3 flex items-center justify-between sm:justify-end sticky top-0 z-20">
          <Link href="/" className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm tracking-tight">D</span>
            </div>
            <span className="font-semibold text-lg tracking-tight text-ink">Dispatch</span>
          </Link>

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/60 transition-colors text-ink-sub hover:text-ink border border-transparent hover:border-border-dim"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 min-w-[16px] h-4 bg-caution text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-canvas">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 top-14 w-80 sm:w-96 bg-white border border-border-dim rounded-2xl shadow-float overflow-hidden z-50">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border-dim">
                  <h3 className="font-semibold text-base text-ink">Notifications</h3>
                  {visibleNotifs.length > 0 && (
                    <button onClick={() => setDismissed(new Set(notifications.map(n => n.id)))} className="text-xs font-medium text-ink-dim hover:text-brand transition-colors">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {visibleNotifs.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="w-12 h-12 bg-surface-alt rounded-full flex items-center justify-center mx-auto mb-3">
                        <Bell className="w-5 h-5 text-ink-dim" />
                      </div>
                      <p className="text-sm font-medium text-ink-sub">You&apos;re all caught up</p>
                    </div>
                  ) : visibleNotifs.slice(0, 10).map(n => {
                    const Icon = NOTIF_ICON[n.type];
                    const clr = NOTIF_COLOR[n.type];
                    return (
                      <Link
                        key={n.id} href={n.href}
                        onClick={() => { setDismissed(prev => new Set(prev).add(n.id)); setShowNotifs(false); }}
                        className="flex items-start gap-3 px-5 py-4 hover:bg-surface-alt transition-colors border-b border-border-dim last:border-0"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${clr}`}><Icon className="w-4 h-4" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-ink">{n.title}</p>
                          <p className="text-xs text-ink-sub truncate mt-0.5">{n.body}</p>
                          <p className="text-[10px] text-ink-dim mt-1.5 flex items-center gap-1"><Clock className="w-3 h-3" /> {timeAgo(n.time)}</p>
                        </div>
                        <button
                          onClick={e => { e.preventDefault(); e.stopPropagation(); setDismissed(prev => new Set(prev).add(n.id)); }}
                          className="shrink-0 p-1 text-ink-dim hover:text-ink-sub transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                    );
                  })}
                </div>
                {visibleNotifs.length > 0 && (
                  <div className="px-5 py-3 border-t border-border-dim bg-surface-alt text-center">
                    <button onClick={() => { setDismissed(new Set(notifications.map(n => n.id))); setShowNotifs(false); }} className="text-xs font-medium text-ink-sub hover:text-ink transition-colors">
                      Dismiss all
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 sm:px-6 pb-24 lg:px-10 lg:pb-10 pt-2 lg:pt-4">
          <div className={`${maxWidth} mx-auto`}>
            {children}
          </div>
        </main>

        <MobileNav />
      </div>
    </div>
  );
}
