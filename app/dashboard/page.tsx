'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Calendar, Clock, CheckCircle2,
  ChevronRight, Star, Loader2, LayoutDashboard,
  Search, LogOut, MapPin, ShieldCheck, Bell,
  Inbox, Plus, Users, Zap, X,
} from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

/* ─── Static ──────────────────────────────────────────────── */

const QUICK_JOBS = [
  { label: 'Plumbing',   slug: 'plumber',     emoji: '🔧' },
  { label: 'Electrical', slug: 'electrician', emoji: '⚡' },
  { label: 'Cleaning',   slug: 'cleaning',    emoji: '🧹' },
  { label: 'Handyman',   slug: 'handyman',    emoji: '🔨' },
  { label: 'Moving',     slug: 'moving-help', emoji: '📦' },
  { label: 'Painting',   slug: 'painting',    emoji: '🎨' },
];

// step drives the labeled stepper component
const STATUS_STAGE: Record<string, { label: string; dot: string; step: number }> = {
  NEW:      { label: 'Waiting for responses', dot: 'bg-blue-400',   step: 0 },
  QUOTED:   { label: 'Quotes received',       dot: 'bg-green-500',  step: 1 },
  CHATTING: { label: 'In discussion',         dot: 'bg-purple-400', step: 1 },
  ACCEPTED: { label: 'Booked',               dot: 'bg-black',       step: 2 },
  DECLINED: { label: 'Declined',             dot: 'bg-gray-300',    step: -1 },
  EXPIRED:  { label: 'Expired',              dot: 'bg-gray-300',    step: -1 },
  COMPLETED:{ label: 'Completed',            dot: 'bg-gray-400',    step: 3 },
};

/* ─── Notification types ──────────────────────────────────── */

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
  quote:   'bg-green-50 text-green-600',
  booking: 'bg-blue-50 text-blue-600',
  status:  'bg-orange-50 text-orange-600',
};

/* ─── Helpers ─────────────────────────────────────────────── */

function capitalize(s?: string | null) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getInitials(name?: string | null) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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

function bookingDateLabel(scheduledAt: string) {
  const date = new Date(scheduledAt);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return 'today';
  if (date.toDateString() === tomorrow.toDateString()) return 'tomorrow';
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function getJobAction(req: any): { label: string; primary: boolean } {
  const q = req.quotes?.length ?? 0;
  if (req.status === 'COMPLETED') return { label: 'Leave a Review',  primary: false };
  if (req.status === 'ACCEPTED')  return { label: 'View Booking',    primary: true };
  if (req.status === 'CHATTING')  return { label: 'Continue Chat',   primary: true };
  if (q > 0)                      return { label: `Review ${q} Quote${q > 1 ? 's' : ''}`, primary: true };
  return                                  { label: 'View Details',   primary: false };
}

/* ─── Sub-components ──────────────────────────────────────── */

// Unified status dot badge — consistent style across all cards
function StatusBadge({ status }: { status: string }) {
  const stage = STATUS_STAGE[status];
  if (!stage) return null;
  return (
    <span className="flex items-center gap-1.5 shrink-0">
      <span className={`w-1.5 h-1.5 rounded-full ${stage.dot}`} />
      <span className="text-xs font-semibold text-gray-500">{stage.label}</span>
    </span>
  );
}

// Labeled 4-step progress tracker — replaces the plain bar
const STEPPER_LABELS = ['Posted', 'Quotes In', 'Choose Pro', 'Completed'];

function JobStepper({ step }: { step: number }) {
  if (step < 0) return null; // don't show for declined/expired
  return (
    <div className="flex items-start my-4">
      {STEPPER_LABELS.map((label, i) => {
        const done    = i < step;
        const current = i === step;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                done    ? 'bg-black' :
                current ? 'bg-black ring-2 ring-offset-1 ring-gray-300' :
                          'border-2 border-gray-200 bg-white'
              }`}>
                {done && (
                  /* inline checkmark — avoids extra icon import */
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {current && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>
              <span className={`text-[9px] font-semibold leading-none whitespace-nowrap ${
                i <= step ? 'text-gray-600' : 'text-gray-300'
              }`}>{label}</span>
            </div>
            {/* connector line — aligned to circle centre */}
            {i < STEPPER_LABELS.length - 1 && (
              <div className={`flex-1 h-px mt-2.5 mx-1 transition-colors ${done ? 'bg-black' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────── */

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [requests, setRequests]       = useState<any[]>([]);
  const [bookings, setBookings]       = useState<any[]>([]);
  const [topPros, setTopPros]         = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showNotifs, setShowNotifs]   = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissed, setDismissed]     = useState<Set<string>>(new Set());
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status !== 'authenticated') return;

    const role = (session?.user as any)?.role;
    if (role === 'ADMIN')    { router.push('/admin/dashboard'); return; }
    if (role === 'PROVIDER') { router.push('/provider/dashboard'); return; }

    Promise.all([
      fetch('/api/requests').then(r => r.json()),
      fetch('/api/bookings').then(r => r.json()),
      fetch('/api/providers').then(r => r.json()),
    ]).then(([reqData, bookData, prosData]) => {
      const reqs  = Array.isArray(reqData)  ? reqData  : [];
      const books = Array.isArray(bookData) ? bookData : [];
      setRequests(reqs);
      setBookings(books);
      setTopPros(Array.isArray(prosData) ? prosData.slice(0, 4) : []);

      const notifs: Notification[] = [];
      for (const req of reqs) {
        const qc = req.quotes?.length ?? 0;
        if (qc > 0) notifs.push({
          id: `q-${req.id}`, type: 'quote',
          title: `${qc} quote${qc > 1 ? 's' : ''} received`,
          body: `${req.category?.name ?? 'Service'}: ${req.description?.slice(0, 50)}${(req.description?.length ?? 0) > 50 ? '…' : ''}`,
          time: req.quotes[qc - 1]?.createdAt ?? req.createdAt,
          href: `/requests/${req.id}`,
        });
      }
      for (const b of books) {
        if (b.status === 'SCHEDULED')
          notifs.push({ id: `b-${b.id}`, type: 'booking', title: 'Upcoming booking', body: `${new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · €${b.totalAmount?.toFixed(0)}`, time: b.createdAt, href: `/bookings/${b.id}` });
        else if (b.status === 'IN_PROGRESS')
          notifs.push({ id: `p-${b.id}`, type: 'status', title: 'Job in progress', body: 'Being worked on right now', time: b.createdAt, href: `/bookings/${b.id}` });
        else if (b.status === 'COMPLETED')
          notifs.push({ id: `d-${b.id}`, type: 'status', title: 'Job completed', body: `€${b.totalAmount?.toFixed(0)} · leave a review`, time: b.createdAt, href: `/bookings/${b.id}` });
      }
      notifs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setNotifications(notifs);
    }).catch(console.error).finally(() => setLoading(false));
  }, [status, session, router]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
    };
    if (showNotifs) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifs]);

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fb]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }
  if (!session) return null;

  /* ── Derived state ── */
  const firstName     = capitalize(session.user?.name?.split(' ')[0]);
  const upcoming      = bookings.filter(b => b.status === 'SCHEDULED');
  const totalQuotes   = requests.reduce((s: number, r: any) => s + (r.quotes?.length ?? 0), 0);
  const quotedReqs    = requests.filter((r: any) => (r.quotes?.length ?? 0) > 0);
  const nextBooking   = upcoming[0] ?? null;
  const visibleNotifs = notifications.filter(n => !dismissed.has(n.id));
  const unreadCount   = visibleNotifs.length;

  // Smart suggestions: filter pros by the category of the most active job
  const activeJob    = requests.find(r => r.status === 'NEW' || r.status === 'QUOTED' || r.status === 'CHATTING');
  const activeCat    = activeJob?.category?.name ?? null;
  const matchedPros  = activeCat
    ? topPros.filter(p => p.categories?.some((c: any) => c.name === activeCat))
    : [];
  const displayPros  = matchedPros.length > 0 ? matchedPros : topPros;

  // Contextual one-liner under greeting
  const heroSubtitle = totalQuotes > 0
    ? `You have ${totalQuotes} quote${totalQuotes > 1 ? 's' : ''} ready to review`
    : nextBooking
    ? `Booking ${bookingDateLabel(nextBooking.scheduledAt)} at ${new Date(nextBooking.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : requests.length > 0
    ? 'Your jobs are being reviewed by local professionals'
    : 'Post a job and receive quotes from trusted pros';

  const showQuotesBanner = totalQuotes > 0 && !!quotedReqs[0];

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex">

      {/* ══ Sidebar ══════════════════════════════════════════ */}
      <aside className="w-16 lg:w-56 bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen shrink-0">
        <div className="p-4 lg:p-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="font-bold text-base tracking-tight hidden lg:block">VilniusPro</span>
          </Link>
        </div>

        <nav className="flex-1 px-2 lg:px-3 py-4 space-y-1 overflow-y-auto">
          <Link href="/dashboard" className="flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-xl font-semibold text-sm bg-black text-white">
            <LayoutDashboard className="w-5 h-5 shrink-0" /><span className="hidden lg:block">Dashboard</span>
          </Link>
          <Link href="/browse" className="flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-xl font-semibold text-sm text-gray-500 hover:text-black hover:bg-gray-50 transition-all">
            <Search className="w-5 h-5 shrink-0" /><span className="hidden lg:block">Find Pros</span>
          </Link>
          <Link href={requests[0] ? `/requests/${requests[0].id}` : '/requests/new'} className="flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-xl font-semibold text-sm text-gray-500 hover:text-black hover:bg-gray-50 transition-all">
            <Inbox className="w-5 h-5 shrink-0" /><span className="hidden lg:block">My Jobs</span>
          </Link>
          <Link href={nextBooking ? `/bookings/${nextBooking.id}` : '/browse'} className="flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-xl font-semibold text-sm text-gray-500 hover:text-black hover:bg-gray-50 transition-all">
            <Calendar className="w-5 h-5 shrink-0" /><span className="hidden lg:block">Bookings</span>
          </Link>
        </nav>

        <div className="p-2 lg:p-3 border-t border-gray-100">
          <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all">
            <LogOut className="w-5 h-5 shrink-0" /><span className="hidden lg:block">Log Out</span>
          </button>
        </div>
      </aside>

      {/* ══ Main area ════════════════════════════════════════ */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-end sticky top-0 z-20">
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
                    <button onClick={() => setDismissed(new Set(notifications.map(n => n.id)))} className="text-[10px] font-bold text-gray-400 hover:text-black transition-colors">
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
                  ) : visibleNotifs.slice(0, 10).map(n => {
                    const Icon = NOTIF_ICON[n.type];
                    const clr  = NOTIF_COLOR[n.type];
                    return (
                      <Link
                        key={n.id} href={n.href}
                        onClick={() => { setDismissed(prev => new Set(prev).add(n.id)); setShowNotifs(false); }}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${clr}`}><Icon className="w-4 h-4" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{n.title}</p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{n.body}</p>
                          <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> {timeAgo(n.time)}</p>
                        </div>
                        <button
                          onClick={e => { e.preventDefault(); e.stopPropagation(); setDismissed(prev => new Set(prev).add(n.id)); }}
                          className="shrink-0 p-1 text-gray-300 hover:text-gray-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                    );
                  })}
                </div>
                {visibleNotifs.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                    <button onClick={() => { setDismissed(new Set(notifications.map(n => n.id))); setShowNotifs(false); }} className="text-xs font-bold text-black hover:underline">
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

            {/* ── Header ────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold tracking-tight">Hello, {firstName} 👋</h1>
                <p className="text-sm text-gray-400 mt-0.5">{heroSubtitle}</p>
              </div>
              <Link
                href="/requests/new"
                className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-gray-800 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" /> Post a Job
              </Link>
            </div>

            {/* ── Quick-job shortcuts ───────────────────────── */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-6" style={{ scrollbarWidth: 'none' }}>
              <span className="text-xs font-semibold text-gray-400 shrink-0 pr-1">Quick post:</span>
              {QUICK_JOBS.map(cat => (
                <Link
                  key={cat.slug}
                  href={`/requests/new?category=${cat.slug}`}
                  className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-gray-200 shadow-sm rounded-full text-xs font-semibold text-gray-600 hover:border-black hover:text-black hover:shadow-md transition-all"
                >
                  <span>{cat.emoji}</span> {cat.label}
                </Link>
              ))}
            </div>

            {/* ── Single priority banner ────────────────────── */}
            {showQuotesBanner && (
              <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3.5 flex items-center gap-3 mb-8">
                <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-green-900">
                    {totalQuotes} quote{totalQuotes > 1 ? 's' : ''} ready to review
                  </p>
                  <p className="text-xs text-green-600 mt-0.5">Compare prices and book the right professional.</p>
                </div>
                <Link href={`/requests/${quotedReqs[0].id}`} className="shrink-0 bg-green-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-green-700 transition-colors">
                  Review Now
                </Link>
              </div>
            )}

            {/* ── Main grid ─────────────────────────────────── */}
            <div className="grid lg:grid-cols-3 gap-6">

              {/* ── Left: My Jobs ── */}
              <div className="lg:col-span-2 space-y-8">

                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-base">My Jobs</h2>
                    {requests.length > 0 && (
                      <span className="text-xs text-gray-400 font-medium">{requests.length} total</span>
                    )}
                  </div>

                  {requests.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                      <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Inbox className="w-7 h-7 text-gray-200" />
                      </div>
                      <p className="font-bold text-sm mb-2">No jobs posted yet</p>
                      <p className="text-xs text-gray-400 mb-6 max-w-xs mx-auto leading-relaxed">
                        Describe your task, choose a category, and get quotes from local professionals within hours.
                      </p>
                      <Link href="/requests/new" className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all">
                        <Plus className="w-4 h-4" /> Post Your First Job
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {requests.slice(0, 6).map(req => {
                        const stage      = STATUS_STAGE[req.status] ?? { label: req.status, dot: 'bg-gray-300', step: 0 };
                        const quoteCount = req.quotes?.length ?? 0;
                        const action     = getJobAction(req);
                        const isActive   = req.status === 'NEW' || req.status === 'QUOTED' || req.status === 'CHATTING';
                        const isBooked   = req.status === 'ACCEPTED';
                        // Best quote's provider for top-match preview
                        const topQuote   = req.quotes?.find((q: any) => q.provider) ?? req.quotes?.[0];
                        const topPro     = topQuote?.provider;

                        return (
                          <div
                            key={req.id}
                            className={`bg-white rounded-2xl p-5 transition-all duration-150 cursor-default ${
                              isBooked
                                ? 'border border-gray-900 shadow-sm'
                                : 'border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5'
                            }`}
                          >
                            {/* Category + status */}
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
                                  {req.category?.name}
                                </span>
                                {req.isUrgent && (
                                  <span className="flex items-center gap-0.5 text-xs font-semibold text-orange-500">
                                    <Zap className="w-3 h-3" /> Urgent
                                  </span>
                                )}
                              </div>
                              <StatusBadge status={req.status} />
                            </div>

                            {/* Title + location */}
                            <p className="font-semibold text-sm mt-2.5 mb-1 line-clamp-1 text-gray-900">{req.description}</p>
                            <p className="flex items-center gap-1 text-xs text-gray-400">
                              <MapPin className="w-3 h-3 shrink-0" /> {req.address}
                            </p>

                            {/* Labeled progress stepper */}
                            <JobStepper step={stage.step} />

                            {/* Top-match preview — shown when quotes exist and provider data available */}
                            {quoteCount > 0 && topPro && (
                              <div className="mb-3 px-3 py-2.5 bg-gray-50 rounded-xl">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Top match</p>
                                <div className="flex items-center gap-2.5">
                                  <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden shrink-0">
                                    <img
                                      src={topPro.user?.image || `https://i.pravatar.cc/40?u=${topQuote?.providerId}`}
                                      alt={topPro.user?.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <span className="text-xs font-semibold text-gray-700">{topPro.user?.name}</span>
                                  {topPro.ratingAvg && (
                                    <span className="flex items-center gap-0.5 text-xs text-gray-500">
                                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                      {topPro.ratingAvg.toFixed(1)}
                                    </span>
                                  )}
                                  {topPro.isVerified && (
                                    <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full">✓ Verified</span>
                                  )}
                                  {topPro.responseTime && (
                                    <span className="text-[10px] text-gray-400 ml-auto">⚡ {topPro.responseTime}</span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Footer: quote count + action */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                              <div className="min-w-0">
                                {quoteCount > 0 ? (
                                  <div className="flex items-center gap-2">
                                    <div className="flex -space-x-1.5">
                                      {req.quotes.slice(0, 3).map((_: any, i: number) => (
                                        <div key={i} className="w-5 h-5 rounded-full bg-gray-200 border-2 border-white" />
                                      ))}
                                    </div>
                                    <span className="text-xs text-gray-500 font-medium">
                                      {quoteCount} quote{quoteCount > 1 ? 's' : ''} received
                                    </span>
                                  </div>
                                ) : isActive ? (
                                  <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Waiting for responses…
                                  </span>
                                ) : null}
                              </div>

                              <Link
                                href={`/requests/${req.id}`}
                                className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                                  action.primary
                                    ? 'bg-black text-white hover:bg-gray-800'
                                    : 'text-gray-500 hover:text-black'
                                }`}
                              >
                                {action.label}
                                {!action.primary && <ChevronRight className="w-3.5 h-3.5" />}
                              </Link>
                            </div>
                          </div>
                        );
                      })}

                      {requests.length > 6 && (
                        <p className="text-center text-xs text-gray-400 font-medium pt-1">
                          Showing 6 of {requests.length} jobs
                        </p>
                      )}
                    </div>
                  )}
                </section>

                {/* Browse Services */}
                <section>
                  <h2 className="font-bold text-base mb-3">Browse Services</h2>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {QUICK_JOBS.map(({ label, slug, emoji }) => (
                      <Link
                        key={slug}
                        href={`/browse?category=${slug}`}
                        className="bg-white border border-gray-100 shadow-sm rounded-2xl p-3 flex flex-col items-center gap-1.5 text-center hover:shadow-md hover:-translate-y-0.5 transition-all group"
                      >
                        <span className="text-xl">{emoji}</span>
                        <span className="text-[11px] font-semibold text-gray-500 group-hover:text-black transition-colors leading-tight">{label}</span>
                      </Link>
                    ))}
                  </div>
                </section>

              </div>

              {/* ── Right column ──────────────────────────── */}
              <div className="space-y-4">

                {/* Post a Job — minimal */}
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4">
                  <p className="font-bold text-sm mb-3">Need something done?</p>
                  <Link href="/requests/new" className="w-full flex items-center justify-center gap-2 bg-black text-white py-2.5 rounded-xl text-xs font-bold hover:bg-gray-800 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Post a Job
                  </Link>
                </div>

                {/* Recommended Pros with trust signals */}
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    {/* Adapts to the active job's category */}
                    <h3 className="font-semibold text-sm text-gray-700">
                      {activeCat && matchedPros.length > 0
                        ? `${activeCat} pros near you`
                        : 'Recommended Pros'}
                    </h3>
                    <Link href="/browse" className="text-[11px] font-bold text-gray-400 hover:text-black transition-colors">
                      See all
                    </Link>
                  </div>

                  {displayPros.length === 0 ? (
                    /* Category browse fallback */
                    <div className="space-y-1">
                      {[
                        { label: 'Electricians', slug: 'electrician', emoji: '⚡' },
                        { label: 'Plumbers',     slug: 'plumber',     emoji: '🔧' },
                        { label: 'Cleaners',     slug: 'cleaning',    emoji: '🧹' },
                      ].map(s => (
                        <Link
                          key={s.slug}
                          href={`/browse?category=${s.slug}`}
                          className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-all group"
                        >
                          <span className="text-base leading-none">{s.emoji}</span>
                          <span className="text-sm font-medium text-gray-600 group-hover:text-black transition-colors flex-1">{s.label}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {displayPros.slice(0, 3).map(pro => (
                        <Link
                          key={pro.id}
                          href={`/providers/${pro.id}`}
                          className="flex items-start gap-3 p-2 rounded-xl hover:bg-gray-50 transition-all group"
                        >
                          {/* Avatar */}
                          <div className="w-9 h-9 rounded-xl bg-gray-100 overflow-hidden shrink-0 grayscale group-hover:grayscale-0 transition-all">
                            <img src={pro.user?.image || `https://i.pravatar.cc/100?u=${pro.id}`} alt={pro.user?.name} className="w-full h-full object-cover" />
                          </div>

                          {/* Name + trust signals */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-semibold truncate">{pro.user?.name}</p>
                              {pro.isVerified && (
                                <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full shrink-0">✓ ID</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {pro.ratingAvg && (
                                <span className="flex items-center gap-0.5 text-xs text-gray-500">
                                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                  {pro.ratingAvg.toFixed(1)}
                                  {pro.completedJobs > 0 && (
                                    <span className="text-[10px] text-gray-400 ml-0.5">({pro.completedJobs})</span>
                                  )}
                                </span>
                              )}
                              {pro.responseTime && (
                                <span className="text-[10px] text-gray-400">⚡ {pro.responseTime}</span>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {displayPros.length > 0 && (
                    <Link href="/browse" className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-black hover:bg-gray-50 transition-all border border-gray-100">
                      Browse all professionals <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>

              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

}
