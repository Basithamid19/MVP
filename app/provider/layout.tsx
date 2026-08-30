'use client';

import { AladdinIcon } from '@/components/icons';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard, Inbox, Briefcase, DollarSign,
  BarChart2, Settings, LifeBuoy, LogOut, ShieldCheck, Bell,
  MessageSquare, X, Clock, Users, CheckCircle2, FileText,
} from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import MobileNav from '@/components/MobileNav';
import { useTranslation, type Dictionary } from '@/lib/i18n';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string;
  isRead: boolean;
  createdAt: string;
}

function timeAgo(date: string, t: Dictionary) {
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return t.messagesPage.justNow;
  if (mins < 60) return `${t.messagesPage.agoPrefix}${mins}${t.messagesPage.minutesSuffix}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${t.messagesPage.agoPrefix}${hrs}${t.messagesPage.hoursSuffix}`;
  return `${t.messagesPage.agoPrefix}${Math.floor(hrs / 24)}${t.messagesPage.daysSuffix}`;
}

const NOTIF_ICON: Record<string, React.ElementType> = {
  message: MessageSquare,
  lead: Users,
  booking: CheckCircle2,
  quote: Users,
  payment: DollarSign,
  status: CheckCircle2,
  review: CheckCircle2,
};

const NOTIF_COLOR: Record<string, string> = {
  message: 'bg-blue-50 text-blue-600',
  lead: 'bg-orange-50 text-orange-600',
  booking: 'bg-green-50 text-green-600',
  quote: 'bg-orange-50 text-orange-600',
  payment: 'bg-green-50 text-green-600',
  status: 'bg-yellow-50 text-yellow-600',
  review: 'bg-blue-50 text-blue-600',
};

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const t = useTranslation();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

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

  // Fetch notifications from persistent API
  useEffect(() => {
    if (!session) return;
    const fetchNotifs = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch {}
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, [session]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    if (showNotifs) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showNotifs]);

  if (pathname?.startsWith('/provider/onboarding')) return <>{children}</>;

  const visibleNotifs = notifications;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markRead = async (ids: string[]) => {
    setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, isRead: true } : n));
    try { await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) }); } catch {}
  };
  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try { await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ markAllRead: true }) }); } catch {}
  };

  return (
    <div className="min-h-screen bg-canvas flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-16 lg:w-64 bg-canvas flex-col sticky top-0 h-screen shrink-0 border-r border-border-dim/50">
        <div className="p-6 lg:p-8">
          <Link href="/provider/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center shrink-0 shadow-sm">
              <AladdinIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-ink hidden lg:block">Aladdin</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
          {NAV_GROUPS.map(group => (
            <div key={group.label}>
              <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest hidden lg:block px-4 mb-2">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || pathname?.startsWith(href + '/');
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                        active ? 'bg-white shadow-sm border border-border-dim text-brand' : 'text-ink-sub hover:text-ink hover:bg-white/60 border border-transparent'
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

        <div className="p-4 lg:p-6 space-y-1">
          <Link
            href="/provider/verification"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-info hover:bg-info-surface transition-all"
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="hidden lg:block">{t.providerNav.verification}</span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ink-dim hover:text-danger hover:bg-danger-surface transition-all"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="hidden lg:block">{t.providerNav.logOut}</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col pb-20 md:pb-0">
        {/* Top bar */}
        <header className="bg-canvas/80 backdrop-blur-xl px-5 sm:px-8 py-4 sm:py-5 flex items-center justify-between sm:justify-end gap-2 sticky top-0 z-20">
          <Link href="/provider/dashboard" className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center shadow-sm">
              <AladdinIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-ink">Aladdin</span>
          </Link>

          <LanguageSwitcher />
          {/* Notifications bell + dropdown */}
          <div className="relative" ref={panelRef}>
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
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border-dim">
                  <h3 className="font-semibold text-base text-ink">{t.providerNav.notifications}</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs font-medium text-ink-dim hover:text-brand transition-colors"
                    >
                      {t.providerNav.markAllRead}
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto">
                  {visibleNotifs.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="w-12 h-12 bg-surface-alt rounded-full flex items-center justify-center mx-auto mb-3">
                        <Bell className="w-5 h-5 text-ink-dim" />
                      </div>
                      <p className="text-sm font-medium text-ink-sub">{t.providerNav.allCaughtUp}</p>
                    </div>
                  ) : (
                    visibleNotifs.slice(0, 10).map(n => {
                      const Icon = NOTIF_ICON[n.type] ?? Bell;
                      const color = NOTIF_COLOR[n.type] ?? 'bg-gray-50 text-gray-600';
                      return (
                        <Link
                          key={n.id}
                          href={n.href}
                          onClick={() => { if (!n.isRead) markRead([n.id]); setShowNotifs(false); }}
                          className={`flex items-start gap-3 px-5 py-4 hover:bg-surface-alt transition-colors border-b border-border-dim last:border-0 ${!n.isRead ? 'bg-brand-muted/30' : ''}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!n.isRead ? 'font-bold' : 'font-medium'} text-ink mb-0.5`}>{n.title}</p>
                            <p className="text-xs text-ink-sub truncate">{n.body}</p>
                            <p className="text-[10px] text-ink-dim mt-1.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {timeAgo(n.createdAt, t)}
                            </p>
                          </div>
                          {!n.isRead && (
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); markRead([n.id]); }}
                              className="shrink-0 p-1 text-ink-dim hover:text-ink-sub transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </Link>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                {unreadCount > 0 && (
                  <div className="px-5 py-3 border-t border-border-dim bg-surface-alt text-center">
                    <button
                      onClick={() => { markAllRead(); setShowNotifs(false); }}
                      className="text-xs font-medium text-ink-sub hover:text-ink transition-colors"
                    >
                      {t.providerNav.markAllAsRead}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* ══ Mobile Bottom Navigation ════════════════════════════════════════ */}
        <MobileNav />
      </div>
    </div>
  );
}
