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
  NEW:      { label: 'Waiting for responses', dot: 'bg-info',   step: 0 },
  QUOTED:   { label: 'Quotes received',       dot: 'bg-trust',  step: 1 },
  CHATTING: { label: 'In discussion',         dot: 'bg-brand-light', step: 1 },
  ACCEPTED: { label: 'Booked',               dot: 'bg-brand',       step: 2 },
  DECLINED: { label: 'Declined',             dot: 'bg-border',    step: -1 },
  EXPIRED:  { label: 'Expired',              dot: 'bg-border',    step: -1 },
  COMPLETED:{ label: 'Completed',            dot: 'bg-border',    step: 3 },
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
  quote:   'bg-trust-surface text-trust',
  booking: 'bg-trust-surface text-trust',
  status:  'bg-caution-surface text-caution',
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
      <span className="text-xs font-semibold text-ink-sub">{stage.label}</span>
    </span>
  );
}

// Labeled 4-step progress tracker — replaces the plain bar
const STEPPER_LABELS = ['Posted', 'Quotes In', 'Choose Pro', 'Completed'];

function JobStepper({ step }: { step: number }) {
  if (step < 0) return null; // don't show for declined/expired
  return (
    <div className="flex items-start my-6">
      {STEPPER_LABELS.map((label, i) => {
        const done    = i < step;
        const current = i === step;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                done    ? 'bg-brand' :
                current ? 'bg-brand ring-2 ring-offset-1 ring-border' :
                          'border-2 border-border bg-white'
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
                i <= step ? 'text-ink-sub' : 'text-ink-dim'
              }`}>{label}</span>
            </div>
            {/* connector line — aligned to circle centre */}
            {i < STEPPER_LABELS.length - 1 && (
              <div className={`flex-1 h-px mt-2.5 mx-1 transition-colors ${done ? 'bg-brand' : 'bg-border'}`} />
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
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <Loader2 className="w-8 h-8 animate-spin text-ink-dim" />
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
    <div className="min-h-screen bg-canvas flex">

      {/* ══ Sidebar ══════════════════════════════════════════ */}
      <aside className="w-16 lg:w-56 bg-canvas flex flex-col sticky top-0 h-screen shrink-0">
        <div className="p-4 lg:p-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand rounded-chip flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="font-bold text-base tracking-tight hidden lg:block">VilniusPro</span>
          </Link>
        </div>

        <nav className="flex-1 px-2 lg:px-3 py-4 space-y-1 overflow-y-auto">
          <Link href="/dashboard" className="flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-input font-semibold text-sm bg-white shadow-sm text-brand">
            <LayoutDashboard className="w-5 h-5 shrink-0" /><span className="hidden lg:block">Dashboard</span>
          </Link>
          <Link href="/browse" className="flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-input font-semibold text-sm text-ink-sub hover:text-ink hover:bg-white/60 transition-all">
            <Search className="w-5 h-5 shrink-0" /><span className="hidden lg:block">Find Pros</span>
          </Link>
          <Link href={requests[0] ? `/requests/${requests[0].id}` : '/requests/new'} className="flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-input font-semibold text-sm text-ink-sub hover:text-ink hover:bg-white/60 transition-all">
            <Inbox className="w-5 h-5 shrink-0" /><span className="hidden lg:block">My Jobs</span>
          </Link>
          <Link href={nextBooking ? `/bookings/${nextBooking.id}` : '/browse'} className="flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-input font-semibold text-sm text-ink-sub hover:text-ink hover:bg-white/60 transition-all">
            <Calendar className="w-5 h-5 shrink-0" /><span className="hidden lg:block">Bookings</span>
          </Link>
        </nav>

        <div className="p-4 lg:p-6">
          <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-input text-sm font-semibold text-ink-dim hover:text-danger hover:bg-danger-surface transition-all">
            <LogOut className="w-5 h-5 shrink-0" /><span className="hidden lg:block">Log Out</span>
          </button>
        </div>
      </aside>

      {/* ══ Main area ════════════════════════════════════════ */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Top bar */}
        <header className="bg-canvas/90 backdrop-blur-md px-6 py-4 flex items-center justify-end sticky top-0 z-20">
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative w-9 h-9 flex items-center justify-center rounded-input hover:bg-white/60 transition-colors text-ink-sub hover:text-ink"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-caution text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white border border-border-dim rounded-panel shadow-float overflow-hidden z-50">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border-dim">
                  <h3 className="font-bold text-base text-ink">Notifications</h3>
                  {visibleNotifs.length > 0 && (
                    <button onClick={() => setDismissed(new Set(notifications.map(n => n.id)))} className="text-xs font-bold text-ink-dim hover:text-brand transition-colors">
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
                    const clr  = NOTIF_COLOR[n.type];
                    return (
                      <Link
                        key={n.id} href={n.href}
                        onClick={() => { setDismissed(prev => new Set(prev).add(n.id)); setShowNotifs(false); }}
                        className="flex items-start gap-3 px-5 py-4 hover:bg-surface-alt transition-colors border-b border-border-dim last:border-0"
                      >
                        <div className={`w-8 h-8 rounded-input flex items-center justify-center shrink-0 ${clr}`}><Icon className="w-4 h-4" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-ink">{n.title}</p>
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
                    <button onClick={() => { setDismissed(new Set(notifications.map(n => n.id))); setShowNotifs(false); }} className="text-xs font-bold text-ink-sub hover:text-ink transition-colors">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-ink mb-2">Welcome back, {firstName}</h1>
                <p className="text-ink-sub text-base">Here's what's happening with your home projects today.</p>
              </div>
              <Link
                href="/requests/new"
                className="inline-flex items-center justify-center gap-2 bg-brand text-white px-6 py-3 rounded-card text-sm font-bold hover:bg-brand-dark transition-all shadow-card hover:shadow-elevated shrink-0"
              >
                <Plus className="w-4 h-4" /> Post a Job
              </Link>
            </div>

            

            {/* ── Single priority banner ────────────────────── */}
            {showQuotesBanner && (
              <div className="bg-trust-surface border border-trust-edge rounded-card px-4 py-3.5 flex items-center gap-3 mb-8">
                <div className="w-8 h-8 bg-trust-surface rounded-input flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-trust" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-green-900">
                    {totalQuotes} quote{totalQuotes > 1 ? 's' : ''} ready to review
                  </p>
                  <p className="text-xs text-trust mt-0.5">Compare prices and book the right professional.</p>
                </div>
                <Link href={`/requests/${quotedReqs[0].id}`} className="shrink-0 bg-trust text-white px-4 py-2 rounded-card text-sm font-bold hover:opacity-90 transition-colors shadow-sm">
                  Review Now
                </Link>
              </div>
            )}

            {/* ── Main grid ─────────────────────────────────── */}
            <div className="grid lg:grid-cols-3 gap-6">

              {/* ── Left: My Jobs ── */}
              <div className="lg:col-span-2 space-y-8">

                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold tracking-tight text-ink">My Jobs</h2>
                    {requests.length > 0 && (
                      <span className="text-sm text-ink-dim font-medium">{requests.length} total</span>
                    )}
                  </div>

                  {requests.length === 0 ? (
                    <div className="bg-white rounded-panel border border-border-dim p-16 text-center shadow-sm">
                      <div className="w-20 h-20 bg-brand-muted rounded-full flex items-center justify-center mx-auto mb-6">
                        <Inbox className="w-10 h-10 text-brand" />
                      </div>
                      <h3 className="text-2xl font-bold text-ink mb-3">No active jobs</h3>
                      <p className="text-base text-ink-sub mb-8 max-w-md mx-auto leading-relaxed">
                        Ready to tackle your next project? Describe what you need done and get quotes from verified Vilnius professionals.
                      </p>
                      <Link href="/requests/new" className="inline-flex items-center justify-center gap-2 bg-brand text-white px-8 py-4 rounded-card text-sm font-bold hover:bg-brand-dark transition-all shadow-card hover:shadow-elevated">
                        <Plus className="w-5 h-5" /> Post Your First Job
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {requests.slice(0, 6).map(req => {
                        const stage      = STATUS_STAGE[req.status] ?? { label: req.status, dot: 'bg-border', step: 0 };
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
                            className={`bg-white rounded-panel p-6 transition-all duration-150 cursor-default ${
                              isBooked
                                ? 'border border-ink shadow-sm'
                                : 'border border-border-dim shadow-sm hover:shadow-elevated hover:-translate-y-0.5'
                            }`}
                          >
                            {/* Category + status */}
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-widest bg-white shadow-sm text-brand-sub px-3 py-1 rounded-full">
                                  {req.category?.name}
                                </span>
                                {req.isUrgent && (
                                  <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-caution bg-caution-surface px-3 py-1 rounded-full">
                                    <Zap className="w-3 h-3" /> Urgent
                                  </span>
                                )}
                              </div>
                              <StatusBadge status={req.status} />
                            </div>

                            {/* Title + location */}
                            <p className="font-bold text-base mt-4 mb-1.5 line-clamp-1 text-ink">{req.description}</p>
                            <p className="flex items-center gap-1.5 text-sm text-ink-sub font-medium">
                              <MapPin className="w-4 h-4 shrink-0 text-ink-dim" /> {req.address}
                            </p>

                            {/* Labeled progress stepper */}
                            <JobStepper step={stage.step} />

                            {/* Top-match preview — shown when quotes exist and provider data available */}
                            {quoteCount > 0 && topPro && (
                              <div className="mb-4 px-4 py-3 bg-surface-alt rounded-card border border-border-dim">
                                <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2">Top match</p>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-border overflow-hidden shrink-0">
                                    <img
                                      src={topPro.user?.image || `https://i.pravatar.cc/40?u=${topQuote?.providerId}`}
                                      alt={topPro.user?.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <span className="text-sm font-bold text-ink">{topPro.user?.name}</span>
                                  {topPro.ratingAvg && (
                                    <span className="flex items-center gap-0.5 text-xs font-bold text-ink-sub">
                                      <Star className="w-3.5 h-3.5 text-brand fill-current" />
                                      {topPro.ratingAvg.toFixed(1)}
                                    </span>
                                  )}
                                  {topPro.isVerified && (
                                    <span className="text-[10px] font-bold text-trust bg-trust-surface px-2 py-0.5 rounded-full">✓ Verified</span>
                                  )}
                                  {topPro.responseTime && (
                                    <span className="text-xs font-medium text-ink-dim ml-auto">⚡ {topPro.responseTime}</span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Footer: quote count + action */}
                            <div className="flex items-center justify-between pt-4 mt-2 border-t border-border-dim">
                              <div className="min-w-0">
                                {quoteCount > 0 ? (
                                  <div className="flex items-center gap-2">
                                    <div className="flex -space-x-1.5">
                                      {req.quotes.slice(0, 3).map((_: any, i: number) => (
                                        <div key={i} className="w-6 h-6 rounded-full bg-surface-alt border-2 border-white" />
                                      ))}
                                    </div>
                                    <span className="text-sm text-ink-sub font-bold">
                                      {quoteCount} quote{quoteCount > 1 ? 's' : ''} received
                                    </span>
                                  </div>
                                ) : isActive ? (
                                  <span className="text-sm text-ink-dim font-medium flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" /> Waiting for responses…
                                  </span>
                                ) : null}
                              </div>

                              <Link
                                href={`/requests/${req.id}`}
                                className={`shrink-0 flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-input transition-all ${
                                  action.primary
                                    ? 'bg-brand text-white hover:bg-brand-dark shadow-sm'
                                    : 'bg-white shadow-sm text-brand hover:bg-border'
                                }`}
                              >
                                {action.label}
                                {!action.primary && <ChevronRight className="w-4 h-4" />}
                              </Link>
                            </div>
                          </div>
                        );
                      })}

                      {requests.length > 6 && (
                        <p className="text-center text-xs text-ink-dim font-medium pt-1">
                          Showing 6 of {requests.length} jobs
                        </p>
                      )}
                    </div>
                  )}
                </section>

                {/* Browse Services */}
                <section>
                  <h2 className="text-xl font-bold tracking-tight text-ink mb-4">Browse Services</h2>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {QUICK_JOBS.map(({ label, slug, emoji }) => (
                      <Link
                        key={slug}
                        href={`/browse?category=${slug}`}
                        className="bg-white border border-transparent shadow-sm rounded-panel p-5 flex flex-col items-center gap-3 text-center hover:shadow-elevated hover:border-brand-muted hover:-translate-y-1 transition-all group"
                      >
                        <span className="text-3xl mb-1">{emoji}</span>
                        <span className="text-sm font-bold text-ink-sub group-hover:text-brand transition-colors leading-tight">{label}</span>
                      </Link>
                    ))}
                  </div>
                </section>

              </div>

              {/* ── Right column ──────────────────────────── */}
              <div className="space-y-4">

                

                {/* Recommended Pros with trust signals */}
                <div className="bg-white border border-border-dim shadow-sm rounded-panel p-6">
                  <div className="flex items-center justify-between mb-4">
                    {/* Adapts to the active job's category */}
                    <h3 className="font-bold text-base text-ink">
                      {activeCat && matchedPros.length > 0
                        ? `${activeCat} pros near you`
                        : 'Recommended Pros'}
                    </h3>
                    <Link href="/browse" className="text-xs font-bold text-ink-dim hover:text-brand transition-colors">
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
                          className="flex items-center gap-3 px-3 py-2.5 rounded-input hover:bg-surface-alt transition-all group"
                        >
                          <span className="text-lg leading-none">{s.emoji}</span>
                          <span className="text-sm font-bold text-ink-sub group-hover:text-ink transition-colors flex-1">{s.label}</span>
                          <ChevronRight className="w-4 h-4 text-ink-dim group-hover:text-ink-sub transition-colors shrink-0" />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {displayPros.slice(0, 3).map(pro => (
                        <Link
                          key={pro.id}
                          href={`/providers/${pro.id}`}
                          className="flex items-start gap-3 p-3 rounded-input hover:bg-surface-alt transition-all group"
                        >
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-input bg-surface-alt overflow-hidden shrink-0 transition-all shadow-sm">
                            <img src={pro.user?.image || `https://i.pravatar.cc/100?u=${pro.id}`} alt={pro.user?.name} className="w-full h-full object-cover" />
                          </div>

                          {/* Name + trust signals */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-bold text-ink truncate">{pro.user?.name}</p>
                              {pro.isVerified && (
                                <span className="text-[10px] font-bold text-trust bg-trust-surface px-1.5 py-0.5 rounded-full shrink-0">✓ ID</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {pro.ratingAvg && (
                                <span className="flex items-center gap-0.5 text-xs text-ink-sub">
                                  <Star className="w-3.5 h-3.5 text-brand fill-current" />
                                  {pro.ratingAvg.toFixed(1)}
                                  {pro.completedJobs > 0 && (
                                    <span className="text-[10px] text-ink-dim ml-0.5">({pro.completedJobs})</span>
                                  )}
                                </span>
                              )}
                              {pro.responseTime && (
                                <span className="text-[10px] text-ink-dim">⚡ {pro.responseTime}</span>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {displayPros.length > 0 && (
                    <Link href="/browse" className="mt-4 w-full flex items-center justify-center gap-1.5 py-3 rounded-card text-sm font-bold text-ink hover:bg-surface-alt transition-all border border-border-dim">
                      Browse all professionals <ChevronRight className="w-4 h-4" />
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
