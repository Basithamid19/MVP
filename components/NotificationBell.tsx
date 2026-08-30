'use client';

/* ─── NotificationBell ──────────────────────────────────────────────────────
 * The single notification bell + dropdown for every shell (CustomerLayout and
 * app/provider/layout.tsx). Previously duplicated ~100 lines in both layouts
 * with two different (and both raw-palette) type→colour maps.
 *
 * Behaviour is the superset of the two old copies:
 *   • polls GET /api/notifications every 15s while a session exists
 *   • optimistic single mark-read (PATCH { ids }) when an unread row is opened
 *     or its × is clicked
 *   • optimistic mark-all-read (PATCH { markAllRead: true }) from the panel
 *     header and footer
 *   • closes on outside mousedown
 * ────────────────────────────────────────────────────────────────────────── */

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Bell, Calendar, CheckCircle2, Clock, DollarSign, MessageSquare, Users, X,
} from 'lucide-react';
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

const NOTIF_ICON: Record<string, React.ElementType> = {
  quote:   Users,
  booking: Calendar,
  status:  CheckCircle2,
  message: MessageSquare,
  payment: DollarSign,
  review:  CheckCircle2,
  lead:    Users,
};

/* Token-only colour map — no raw palette classes. */
const NOTIF_COLOR: Record<string, string> = {
  quote:   'bg-brand-muted text-brand',
  booking: 'bg-info-surface text-info',
  status:  'bg-caution-surface text-caution',
  message: 'bg-brand-muted text-brand',
  payment: 'bg-trust-surface text-trust',
  review:  'bg-info-surface text-info',
  lead:    'bg-caution-surface text-caution',
};
const NOTIF_COLOR_FALLBACK = 'bg-surface-alt text-ink-sub';

function timeAgo(date: string, t: Dictionary) {
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return t.messagesPage.justNow;
  if (mins < 60) return `${t.messagesPage.agoPrefix}${mins}${t.messagesPage.minutesSuffix}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${t.messagesPage.agoPrefix}${hrs}${t.messagesPage.hoursSuffix}`;
  return `${t.messagesPage.agoPrefix}${Math.floor(hrs / 24)}${t.messagesPage.daysSuffix}`;
}

export interface NotificationBellProps {
  /** Which edge of the trigger the dropdown is anchored to. Default 'right'. */
  align?: 'left' | 'right';
}

export default function NotificationBell({ align = 'right' }: NotificationBellProps) {
  const { data: session } = useSession();
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  // Poll the persistent notifications API (15s — same cadence as before).
  useEffect(() => {
    if (!session) return;
    const fetchNotifs = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setNotifications(data);
        }
      } catch {}
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, [session]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Guests (browse/category are public) get no bell — it could only ever be empty.
  if (!session) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markRead = async (ids: string[]) => {
    setNotifications(prev => prev.map(n => (ids.includes(n.id) ? { ...n, isRead: true } : n)));
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
    } catch {}
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
    } catch {}
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={t.providerNav.notifications}
        aria-expanded={open}
        className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-card/60 transition-colors text-ink-sub hover:text-ink border border-transparent hover:border-border-dim"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 min-w-[16px] h-4 bg-caution text-white text-3xs font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-canvas">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} top-12 w-80 sm:w-96 bg-card rounded-panel shadow-float border border-border-dim overflow-hidden z-50`}
        >
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
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 bg-surface-alt rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-5 h-5 text-ink-dim" />
                </div>
                <p className="text-sm font-medium text-ink-sub">{t.providerNav.allCaughtUp}</p>
              </div>
            ) : (
              notifications.slice(0, 10).map(n => {
                const Icon = NOTIF_ICON[n.type] ?? Bell;
                const color = NOTIF_COLOR[n.type] ?? NOTIF_COLOR_FALLBACK;
                return (
                  <Link
                    key={n.id}
                    href={n.href}
                    onClick={() => { if (!n.isRead) markRead([n.id]); setOpen(false); }}
                    className={`flex items-start gap-3 px-5 py-4 hover:bg-surface-alt transition-colors border-b border-border-dim last:border-0 ${!n.isRead ? 'bg-brand-muted/30' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.isRead ? 'font-bold' : 'font-medium'} text-ink mb-0.5`}>{n.title}</p>
                      <p className="text-xs text-ink-sub truncate">{n.body}</p>
                      <p className="text-3xs text-ink-dim mt-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {timeAgo(n.createdAt, t)}
                      </p>
                    </div>
                    {!n.isRead && (
                      <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); markRead([n.id]); }}
                        aria-label={t.providerNav.markAllRead}
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
                onClick={() => { markAllRead(); setOpen(false); }}
                className="text-xs font-medium text-ink-sub hover:text-ink transition-colors"
              >
                {t.providerNav.markAllAsRead}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
