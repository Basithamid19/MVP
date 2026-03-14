'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Calendar, Clock, MessageSquare, CheckCircle2,
  ChevronRight, Star, Loader2, LayoutDashboard,
  Search, LogOut, MapPin, ShieldCheck, Bell,
  Inbox, Plus, Users, Zap, ArrowRight, Wrench, X,
} from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

const POPULAR_SERVICES = [
  { label: 'Plumber',     slug: 'plumber',     emoji: '🔧' },
  { label: 'Electrician', slug: 'electrician', emoji: '⚡' },
  { label: 'Cleaning',    slug: 'cleaning',    emoji: '🧹' },
  { label: 'Handyman',    slug: 'handyman',    emoji: '🔨' },
  { label: 'Moving Help', slug: 'moving-help', emoji: '📦' },
  { label: 'Painting',    slug: 'painting',    emoji: '🎨' },
];

const STATUS_META: Record<string, { label: string; color: string }> = {
  NEW:      { label: 'Waiting for quotes',  color: 'bg-blue-50 text-blue-600' },
  CHATTING: { label: 'In discussion',       color: 'bg-purple-50 text-purple-600' },
  QUOTED:   { label: 'Quotes received',     color: 'bg-green-50 text-green-700' },
  ACCEPTED: { label: 'Accepted',            color: 'bg-green-50 text-green-700' },
  DECLINED: { label: 'Declined',            color: 'bg-gray-50 text-gray-400' },
  EXPIRED:  { label: 'Expired',             color: 'bg-gray-50 text-gray-400' },
};

function capitalize(s?: string | null) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getInitials(name?: string | null) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

interface Notification {
  id: string;
  type: 'quote' | 'booking' | 'status';
  title: string;
  body: string;
  time: string;
  href: string;
}

function timeAgo(date: string) {
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const NOTIF_ICON: Record<string, React.ElementType> = {
  quote: Users,
  booking: Calendar,
  status: CheckCircle2,
};

const NOTIF_COLOR: Record<string, string> = {
  quote: 'bg-green-50 text-green-600',
  booking: 'bg-blue-50 text-blue-600',
  status: 'bg-orange-50 text-orange-600',
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests]   = useState<any[]>([]);
  const [bookings, setBookings]   = useState<any[]>([]);
  const [topPros, setTopPros]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role === 'ADMIN')    { router.push('/admin/dashboard'); return; }
      if (role === 'PROVIDER') { router.push('/provider/dashboard'); return; }

      Promise.all([
        fetch('/api/requests').then(r => r.json()),
        fetch('/api/bookings').then(r => r.json()),
        fetch('/api/providers').then(r => r.json()),
      ]).then(([reqData, bookData, prosData]) => {
        const reqs = Array.isArray(reqData) ? reqData : [];
        const books = Array.isArray(bookData) ? bookData : [];
        setRequests(reqs);
        setBookings(books);
        setTopPros(Array.isArray(prosData) ? prosData.slice(0, 3) : []);

        const notifs: Notification[] = [];
        for (const req of reqs) {
          const quoteCount = req.quotes?.length ?? 0;
          if (quoteCount > 0) {
            notifs.push({
              id: `quote-${req.id}`,
              type: 'quote',
              title: `${quoteCount} quote${quoteCount > 1 ? 's' : ''} received`,
              body: `${req.category?.name ?? 'Service'}: ${req.description?.slice(0, 50)}${(req.description?.length ?? 0) > 50 ? '…' : ''}`,
              time: req.quotes[req.quotes.length - 1]?.createdAt ?? req.createdAt,
              href: `/requests/${req.id}`,
            });
          }
        }
        for (const b of books) {
          if (b.status === 'SCHEDULED') {
            notifs.push({
              id: `book-${b.id}`,
              type: 'booking',
              title: 'Upcoming booking',
              body: `Scheduled for ${new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · €${b.totalAmount?.toFixed(0)}`,
              time: b.createdAt,
              href: `/bookings/${b.id}`,
            });
          } else if (b.status === 'IN_PROGRESS') {
            notifs.push({
              id: `prog-${b.id}`,
              type: 'status',
              title: 'Job in progress',
              body: `Your booking is currently being worked on`,
              time: b.createdAt,
              href: `/bookings/${b.id}`,
            });
          } else if (b.status === 'COMPLETED') {
            notifs.push({
              id: `done-${b.id}`,
              type: 'status',
              title: 'Job completed',
              body: `Your booking has been completed · €${b.totalAmount?.toFixed(0)}`,
              time: b.createdAt,
              href: `/bookings/${b.id}`,
            });
          }
        }
        notifs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        setNotifications(notifs);
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [status, session, router]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    if (showNotifs) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showNotifs]);

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }
  if (!session) return null;

  const firstName   = capitalize(session.user?.name?.split(' ')[0]);
  const upcoming    = bookings.filter(b => b.status === 'SCHEDULED');
  const completed   = bookings.filter(b => b.status === 'COMPLETED');
  const activeReqs  = requests.filter(r => r.status === 'NEW' || r.status === 'QUOTED' || r.status === 'CHATTING');
  const totalQuotes = requests.reduce((s: number, r: any) => s + (r.quotes?.length ?? 0), 0);
  const visibleNotifs = notifications.filter(n => !dismissed.has(n.id));
  const unreadCount = visibleNotifs.length;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Sidebar ── */}
      <aside className="w-16 lg:w-60 bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen shrink-0">
        {/* Logo */}
        <div className="p-4 lg:p-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="font-bold text-base tracking-tight hidden lg:block">VilniusPro</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 lg:px-3 py-4 space-y-5 overflow-y-auto">
          {/* Overview */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden lg:block px-2 mb-1.5">Overview</p>
            <Link href="/dashboard" className="flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-xl font-semibold text-sm bg-black text-white">
              <LayoutDashboard className="w-5 h-5 shrink-0" />
              <span className="hidden lg:block">Dashboard</span>
            </Link>
          </div>

          {/* Discover */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden lg:block px-2 mb-1.5">Discover</p>
            <Link href="/browse" className="flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-xl font-semibold text-sm text-gray-500 hover:text-black hover:bg-gray-50 transition-all">
              <Search className="w-5 h-5 shrink-0" />
              <span className="hidden lg:block">Find Pros</span>
            </Link>
          </div>

          {/* Activity */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden lg:block px-2 mb-1.5">Activity</p>
            <Link href="/requests/new" className="flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-xl font-semibold text-sm text-gray-500 hover:text-black hover:bg-gray-50 transition-all">
              <Plus className="w-5 h-5 shrink-0" />
              <span className="hidden lg:block">New Request</span>
            </Link>
          </div>
        </nav>

        {/* Logout */}
        <div className="p-2 lg:p-3 border-t border-gray-100">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="hidden lg:block">Log Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main wrapper ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-end gap-2 sticky top-0 z-10">
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors text-gray-500 hover:text-black"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="font-bold text-sm">Notifications</h3>
                  {visibleNotifs.length > 0 && (
                    <button
                      onClick={() => setDismissed(new Set(notifications.map(n => n.id)))}
                      className="text-[10px] font-bold text-gray-400 hover:text-black transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {visibleNotifs.length === 0 ? (
                    <div className="py-10 text-center">
                      <Bell className="w-6 h-6 text-gray-200 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">You&apos;re all caught up</p>
                    </div>
                  ) : (
                    visibleNotifs.slice(0, 10).map(n => {
                      const Icon = NOTIF_ICON[n.type];
                      const color = NOTIF_COLOR[n.type];
                      return (
                        <Link
                          key={n.id}
                          href={n.href}
                          onClick={() => { setDismissed(prev => new Set(prev).add(n.id)); setShowNotifs(false); }}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold">{n.title}</p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{n.body}</p>
                            <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {timeAgo(n.time)}
                            </p>
                          </div>
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDismissed(prev => new Set(prev).add(n.id)); }}
                            className="shrink-0 p-1 text-gray-300 hover:text-gray-500 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </Link>
                      );
                    })
                  )}
                </div>

                {visibleNotifs.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                    <button
                      onClick={() => { setDismissed(new Set(notifications.map(n => n.id))); setShowNotifs(false); }}
                      className="text-xs font-bold text-black hover:underline"
                    >
                      Dismiss all
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-5xl mx-auto">

            {/* ── Hero ── */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center text-base font-bold shrink-0 select-none">
                  {getInitials(session.user?.name)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Sveiki, {firstName}!</h1>
                  <p className="text-sm text-gray-500 mt-0.5">Find, book, and manage trusted home service professionals.</p>
                </div>
              </div>
              <Link
                href="/requests/new"
                className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-gray-800 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                Request a Service
              </Link>
            </div>

            {/* ── Activity banner ── */}
            {totalQuotes > 0 && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-green-800">
                    {totalQuotes} professional{totalQuotes > 1 ? 's have' : ' has'} responded to your requests
                  </p>
                  <p className="text-xs text-green-600 mt-0.5">Review their quotes and book the best match.</p>
                </div>
                <Link href={`/requests/${requests.find((r: any) => r.quotes?.length > 0)?.id}`} className="shrink-0 bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition-colors">
                  Review Quotes
                </Link>
              </div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
              {/* ── Left / centre column ── */}
              <div className="lg:col-span-2 space-y-6">

                {/* Upcoming Bookings */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg">Upcoming Bookings</h2>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{upcoming.length} scheduled</span>
                  </div>

                  {upcoming.length > 0 ? (
                    <div className="space-y-3">
                      {upcoming.map(b => (
                        <div key={b.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-black transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-2xl overflow-hidden grayscale group-hover:grayscale-0 transition-all shrink-0">
                              <img
                                src={b.provider?.user?.image || `https://i.pravatar.cc/150?u=${b.id}`}
                                alt="Provider"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-bold text-sm">{b.provider?.user?.name ?? 'Professional'}</p>
                              <div className="flex items-center gap-3 text-xs text-gray-400 font-medium mt-0.5">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(b.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm">€{b.totalAmount?.toFixed(2)}</p>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider mt-1 inline-block">Scheduled</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Calendar className="w-6 h-6 text-gray-300" />
                      </div>
                      <p className="font-bold text-sm mb-1">No upcoming bookings yet</p>
                      <p className="text-xs text-gray-400 mb-4">Find trusted professionals and book your first service.</p>
                      <Link href="/browse" className="inline-flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-800 transition-all">
                        <Search className="w-3.5 h-3.5" /> Find a Pro
                      </Link>
                    </div>
                  )}
                </section>

                {/* Recent Requests */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg">Recent Requests</h2>
                    {requests.length > 0 && (
                      <Link href="/requests" className="text-xs font-bold text-black border-b border-black pb-0.5 hover:opacity-70">View all</Link>
                    )}
                  </div>

                  {requests.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Inbox className="w-6 h-6 text-gray-300" />
                      </div>
                      <p className="font-bold text-sm mb-1">No service requests yet</p>
                      <p className="text-xs text-gray-400 mb-4">Post a job and get quotes from verified local professionals.</p>
                      <Link href="/requests/new" className="inline-flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-800 transition-all">
                        <Plus className="w-3.5 h-3.5" /> Request a Service
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {requests.slice(0, 4).map(req => {
                        const meta = STATUS_META[req.status] ?? { label: req.status, color: 'bg-gray-50 text-gray-400' };
                        const quoteCount = req.quotes?.length ?? 0;
                        return (
                          <div key={req.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-black transition-all">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                  <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
                                    {req.category?.name}
                                  </span>
                                  {req.isUrgent && (
                                    <span className="flex items-center gap-0.5 text-xs font-bold text-orange-600">
                                      <Zap className="w-3 h-3" /> Urgent
                                    </span>
                                  )}
                                </div>
                                <p className="font-bold text-sm line-clamp-1">{req.description}</p>
                                <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                  <MapPin className="w-3 h-3" /> {req.address}
                                </p>
                              </div>
                              <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${meta.color}`}>
                                {meta.label}
                              </span>
                            </div>

                            {/* Activity row */}
                            {quoteCount > 0 ? (
                              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                <div className="flex items-center gap-2">
                                  <div className="flex -space-x-1.5">
                                    {req.quotes.slice(0, 3).map((_: any, i: number) => (
                                      <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white" />
                                    ))}
                                  </div>
                                  <span className="text-xs font-semibold text-gray-700">
                                    {quoteCount} professional{quoteCount > 1 ? 's' : ''} responded
                                  </span>
                                </div>
                                <Link href={`/requests/${req.id}`} className="flex items-center gap-1 text-xs font-bold text-black hover:gap-2 transition-all">
                                  Review Quotes <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            ) : (
                              <div className="pt-3 border-t border-gray-50">
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Waiting for professionals to respond…
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Popular Services */}
                <section>
                  <h2 className="font-bold text-lg mb-4">Popular Services</h2>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {POPULAR_SERVICES.map(({ label, slug, emoji }) => (
                      <Link
                        key={slug}
                        href={`/browse?category=${slug}`}
                        className="bg-white border border-gray-100 rounded-2xl p-3 flex flex-col items-center gap-1.5 text-center hover:border-black hover:shadow-sm transition-all group"
                      >
                        <span className="text-2xl">{emoji}</span>
                        <span className="text-xs font-bold text-gray-600 group-hover:text-black transition-colors">{label}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              </div>

              {/* ── Right column ── */}
              <div className="space-y-5">

                {/* Recommended Pros */}
                <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm">Recommended for You</h3>
                    <Link href="/browse" className="text-xs font-bold text-black border-b border-black pb-0.5 hover:opacity-70">See all</Link>
                  </div>

                  {topPros.length === 0 ? (
                    <div className="text-center py-4">
                      <Wrench className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">No professionals yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {topPros.map(pro => (
                        <Link
                          key={pro.id}
                          href={`/providers/${pro.id}`}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-all group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden shrink-0 grayscale group-hover:grayscale-0 transition-all">
                            <img
                              src={pro.user?.image || `https://i.pravatar.cc/100?u=${pro.id}`}
                              alt={pro.user?.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{pro.user?.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className="flex items-center gap-0.5">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                <span className="text-xs font-semibold text-gray-700">{pro.ratingAvg?.toFixed(1) ?? '—'}</span>
                              </div>
                              <span className="text-[10px] text-gray-400">·</span>
                              <span className="text-[10px] text-gray-400 truncate">
                                {pro.categories?.[0]?.name ?? 'Professional'}
                              </span>
                            </div>
                          </div>
                          {pro.isVerified && (
                            <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center shrink-0">
                              <ShieldCheck className="w-3 h-3" />
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}

                  <Link
                    href="/requests/new"
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-black text-white py-2.5 rounded-xl text-xs font-bold hover:bg-gray-800 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Post a Job
                  </Link>
                </div>

                {/* Your Stats */}
                <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
                  <h3 className="font-bold text-sm mb-4">Your Stats</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">Completed Jobs</span>
                      <span className="font-bold">{completed.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">Active Requests</span>
                      <span className="font-bold">{activeReqs.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">Quotes Received</span>
                      <span className="font-bold text-green-600">{totalQuotes}</span>
                    </div>
                    {completed.length > 0 && (
                      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" /> Avg Rating Given
                        </span>
                        <span className="font-bold">4.9</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Trusted Professionals */}
                <div className="bg-black text-white rounded-3xl p-5 shadow-xl">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-sm mb-1.5">Trusted Professionals</h3>
                  <p className="text-gray-400 text-xs leading-relaxed mb-4">
                    Every professional on VilniusPro is identity-verified and background-checked so you can book with confidence.
                  </p>
                  <Link
                    href="/browse"
                    className="w-full flex items-center justify-center gap-2 bg-white text-black py-2.5 rounded-xl text-xs font-bold hover:bg-gray-100 transition-all"
                  >
                    Browse Verified Pros <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
