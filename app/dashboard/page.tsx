'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Calendar, Clock, CheckCircle2,
  ChevronRight, Star, Loader2, LayoutDashboard,
  Search, LogOut, MapPin, Bell,
  Inbox, Plus, Users, Zap, X, ShieldCheck,
  Wrench, Hammer, Truck, Paintbrush
} from 'lucide-react';

// Custom Broom Icon for Cleaning
const BroomIcon = ({ className, strokeWidth = 1.5 }: { className?: string, strokeWidth?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <g transform="scale(1.2) translate(-2, -2)">
      <path d="M18 2l-6 6" />
      <path d="M15 8c-3-3-8-3-11 0l-3 3h11l3-3z" />
      <path d="M4 11v9" />
      <path d="M10 11v9" />
      <path d="M1 20h13" />
      <path d="M17 14h5" />
      <path d="M18 17h4" />
      <path d="M17 20h5" />
    </g>
  </svg>
);

// Custom Plug/Electrician Icon
const ElectricianIcon = ({ className, strokeWidth = 1.5 }: { className?: string, strokeWidth?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <path d="M6 6h12a2 2 0 0 1 2 2v4a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6V8a2 2 0 0 1 2-2z" />
    <path d="M12 18v4" />
    <path d="M10 12h4" />
  </svg>
);
import Link from 'next/link';
import { signOut } from 'next-auth/react';

/* ─── Static ──────────────────────────────────────────────── */

const QUICK_JOBS = [
  { label: 'Plumbing',   slug: 'plumber',     Icon: Wrench },
  { label: 'Electrical', slug: 'electrician', Icon: ElectricianIcon },
  { label: 'Cleaning',   slug: 'cleaning',    Icon: BroomIcon },
  { label: 'Handyman',   slug: 'handyman',    Icon: Hammer },
  { label: 'Moving',     slug: 'moving-help', Icon: Truck },
  { label: 'Painting',   slug: 'painting',    Icon: Paintbrush },
];

const STATUS_STAGE: Record<string, { label: string; dot: string; step: number }> = {
  NEW:      { label: 'Waiting for quotes', dot: 'bg-info',   step: 0 },
  QUOTED:   { label: 'Quotes received',    dot: 'bg-trust',  step: 1 },
  CHATTING: { label: 'In discussion',      dot: 'bg-brand-light', step: 1 },
  ACCEPTED: { label: 'Booked',             dot: 'bg-brand',       step: 2 },
  DECLINED: { label: 'Declined',           dot: 'bg-border',    step: -1 },
  EXPIRED:  { label: 'Expired',            dot: 'bg-border',    step: -1 },
  COMPLETED:{ label: 'Completed',          dot: 'bg-border',    step: 3 },
};

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

function timeAgo(date: string) {
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
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

function StatusBadge({ status }: { status: string }) {
  const stage = STATUS_STAGE[status];
  if (!stage) return null;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-alt rounded-full border border-border-dim">
      <span className={`w-1.5 h-1.5 rounded-full ${stage.dot}`} />
      <span className="text-xs font-medium text-ink-sub">{stage.label}</span>
    </span>
  );
}

const STEPPER_LABELS = ['Posted', 'Quotes', 'Selected', 'Done'];

function JobStepper({ step }: { step: number }) {
  if (step < 0) return null;
  return (
    <div className="w-full">
      <div className="flex items-center gap-1 mb-2">
        {STEPPER_LABELS.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-brand' : 'bg-border'}`} />
        ))}
      </div>
      <div className="flex items-center justify-between px-1">
        {STEPPER_LABELS.map((label, i) => (
          <span key={label} className={`text-[10px] font-bold uppercase tracking-widest ${i <= step ? 'text-ink' : 'text-ink-dim'}`}>
            {label}
          </span>
        ))}
      </div>
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
  const activeCat     = requests[0]?.category?.name;
  
  // Filter top pros to match active category if possible
  const matchedPros = activeCat 
    ? topPros.filter(p => p.categories?.some((c: any) => c.name === activeCat))
    : [];
  const displayPros = matchedPros.length > 0 ? matchedPros : topPros;

  const visibleNotifs = notifications.filter(n => !dismissed.has(n.id));
  const unreadCount   = visibleNotifs.length;
  const showQuotesBanner = totalQuotes > 0 && !!quotedReqs[0];

  return (
    <div className="min-h-screen bg-canvas flex font-sans">

      {/* ══ Sidebar ══════════════════════════════════════════ */}
      <aside className="w-16 lg:w-64 bg-canvas flex flex-col sticky top-0 h-screen shrink-0 border-r border-border-dim/50">
        <div className="p-6 lg:p-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-white font-bold text-sm tracking-tight">V</span>
            </div>
            <span className="font-semibold text-lg tracking-tight text-ink hidden lg:block">VilniusPro</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm bg-white shadow-sm border border-border-dim text-brand">
            <LayoutDashboard className="w-4 h-4 shrink-0" /><span className="hidden lg:block">Dashboard</span>
          </Link>
          <Link href="/browse" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-ink-sub hover:text-ink hover:bg-white/60 transition-all">
            <Search className="w-4 h-4 shrink-0" /><span className="hidden lg:block">Find Pros</span>
          </Link>
          <Link href={requests[0] ? `/requests/${requests[0].id}` : '/requests/new'} className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-ink-sub hover:text-ink hover:bg-white/60 transition-all">
            <Inbox className="w-4 h-4 shrink-0" /><span className="hidden lg:block">My Jobs</span>
          </Link>
          <Link href={nextBooking ? `/bookings/${nextBooking.id}` : '/browse'} className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-ink-sub hover:text-ink hover:bg-white/60 transition-all">
            <Calendar className="w-4 h-4 shrink-0" /><span className="hidden lg:block">Bookings</span>
          </Link>
        </nav>

        <div className="p-4 lg:p-6">
          <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ink-dim hover:text-danger hover:bg-danger-surface transition-all">
            <LogOut className="w-4 h-4 shrink-0" /><span className="hidden lg:block">Log Out</span>
          </button>
        </div>
      </aside>

      {/* ══ Main area ════════════════════════════════════════ */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Top bar */}
        <header className="bg-canvas/80 backdrop-blur-xl px-8 py-5 flex items-center justify-end sticky top-0 z-20">
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
                    const clr  = NOTIF_COLOR[n.type];
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
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-5xl mx-auto">

            {/* ── Header ────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
              <div>
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink mb-2">Welcome back, {firstName}</h1>
                <p className="text-ink-sub text-base">Here is what's happening with your home projects.</p>
              </div>
              <Link
                href="/requests/new"
                className="inline-flex items-center justify-center gap-2 bg-brand text-white px-7 py-3.5 rounded-full text-sm font-medium hover:bg-brand-dark transition-all shadow-sm hover:shadow-md shrink-0"
              >
                <Plus className="w-4 h-4" /> Post a Job
              </Link>
            </div>

            {/* ── Priority Banner ───────────────────────────── */}
            {showQuotesBanner && (
              <div className="relative overflow-hidden bg-brand text-white rounded-[24px] p-6 sm:p-8 mb-10 shadow-elevated flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
                <div className="relative z-10 flex items-center gap-5">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0 backdrop-blur-md">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold mb-1">{totalQuotes} new quote{totalQuotes > 1 ? 's' : ''} received</h2>
                    <p className="text-white/80 text-sm">Professionals have responded to your request. Review and book now.</p>
                  </div>
                </div>
                <Link href={`/requests/${quotedReqs[0].id}`} className="relative z-10 shrink-0 w-full sm:w-auto text-center bg-white text-brand px-8 py-3.5 rounded-full text-sm font-semibold hover:bg-surface-alt transition-colors shadow-sm">
                  Review Quotes
                </Link>
              </div>
            )}

            {/* ── Main grid ─────────────────────────────────── */}
            <div className="grid lg:grid-cols-3 gap-8">

              {/* ── Left: My Jobs ── */}
              <div className="lg:col-span-2 space-y-10">

                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold tracking-tight text-ink">My Jobs</h2>
                    {requests.length > 0 && (
                      <span className="text-sm text-ink-dim font-medium">{requests.length} active</span>
                    )}
                  </div>

                  {requests.length === 0 ? (
                    <div className="bg-white rounded-[24px] border border-border-dim p-12 sm:p-16 text-center shadow-sm">
                      <div className="w-20 h-20 bg-canvas rounded-full flex items-center justify-center mx-auto mb-6 border border-border-dim">
                        <Inbox className="w-8 h-8 text-ink-dim" />
                      </div>
                      <h3 className="text-2xl font-semibold text-ink mb-3">No active projects</h3>
                      <p className="text-ink-sub mb-8 max-w-md mx-auto leading-relaxed">
                        Ready to tackle your next home project? Describe what you need done and get quotes from verified Vilnius professionals.
                      </p>
                      <Link href="/requests/new" className="inline-flex items-center justify-center gap-2 bg-brand text-white px-8 py-4 rounded-full text-sm font-medium hover:bg-brand-dark transition-all shadow-sm hover:shadow-md">
                        <Plus className="w-5 h-5" /> Post a Job
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {requests.slice(0, 6).map(req => {
                        const stage      = STATUS_STAGE[req.status] ?? { label: req.status, dot: 'bg-border', step: 0 };
                        const quoteCount = req.quotes?.length ?? 0;
                        const action     = getJobAction(req);
                        const isBooked   = req.status === 'ACCEPTED';
                        const topQuote   = req.quotes?.find((q: any) => q.provider) ?? req.quotes?.[0];
                        const topPro     = topQuote?.provider;

                        return (
                          <div
                            key={req.id}
                            className={`bg-white rounded-[24px] p-6 sm:p-8 transition-all duration-200 ${
                              isBooked
                                ? 'border border-brand/20 shadow-md'
                                : 'border border-border-dim shadow-sm hover:shadow-md hover:border-border'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4 mb-6">
                              <div>
                                <div className="flex items-center gap-2 mb-2.5">
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-ink-dim">
                                    {req.category?.name}
                                  </span>
                                  {req.isUrgent && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-caution">
                                      <Zap className="w-3 h-3" /> Urgent
                                    </span>
                                  )}
                                </div>
                                <h3 className="font-semibold text-xl text-ink leading-tight mb-2">{req.description}</h3>
                                <p className="flex items-center gap-1.5 text-sm text-ink-sub">
                                  <MapPin className="w-4 h-4 shrink-0 text-ink-dim" /> {req.address}
                                </p>
                              </div>
                              <StatusBadge status={req.status} />
                            </div>

                            <div className="py-4 my-4 border-y border-border-dim">
                              <JobStepper step={stage.step} />
                            </div>

                            {quoteCount > 0 && topPro && (
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-surface-alt rounded-2xl p-4 border border-border-dim">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={topPro.user?.image || `https://i.pravatar.cc/40?u=${topQuote?.providerId}`}
                                    alt={topPro.user?.name}
                                    className="w-10 h-10 rounded-full object-cover shadow-sm bg-white"
                                  />
                                  <div>
                                    <p className="text-sm font-semibold text-ink leading-none mb-1.5">{topPro.user?.name}</p>
                                    <div className="flex items-center gap-2">
                                      {topPro.ratingAvg && (
                                        <span className="flex items-center gap-0.5 text-xs font-medium text-ink-sub">
                                          <Star className="w-3 h-3 text-brand fill-current" />
                                          {topPro.ratingAvg.toFixed(1)}
                                        </span>
                                      )}
                                      {topPro.isVerified && (
                                        <span className="text-[10px] font-medium text-trust">✓ Verified</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="sm:text-right pl-12 sm:pl-0">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-ink-dim mb-0.5">Est. Price</p>
                                  <p className="text-base font-semibold text-ink">€{topQuote.price}</p>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium text-ink-sub">
                                {quoteCount > 0 ? (
                                  <span className="text-ink font-semibold">{quoteCount} quote{quoteCount > 1 ? 's' : ''}</span>
                                ) : (
                                  <span className="text-ink-dim">Waiting for professionals...</span>
                                )}
                              </div>

                              <Link
                                href={`/requests/${req.id}`}
                                className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                                  action.primary ? 'text-brand hover:text-brand-dark' : 'text-ink-sub hover:text-ink'
                                }`}
                              >
                                {action.label} <ChevronRight className="w-4 h-4" />
                              </Link>
                            </div>
                          </div>
                        );
                      })}

                      {requests.length > 6 && (
                        <div className="pt-4 text-center">
                          <Link href="/requests" className="text-sm font-medium text-ink-sub hover:text-ink transition-colors">
                            View all {requests.length} jobs
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* Browse Services */}
                <section className="pt-6">
                  <h2 className="text-xl font-semibold tracking-tight text-ink mb-6">Browse Services</h2>
                  <div className="flex items-center gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
                    {QUICK_JOBS.map(({ label, slug, Icon }) => (
                      <Link
                        key={slug}
                        href={`/browse?category=${slug}`}
                        className="shrink-0 w-[140px] bg-white border border-border-dim shadow-sm rounded-[20px] p-6 flex flex-col items-center gap-4 text-center hover:shadow-md hover:border-brand/30 hover:-translate-y-1 transition-all group"
                      >
                        <div className="w-14 h-14 bg-surface-alt rounded-full flex items-center justify-center text-ink-sub group-hover:bg-brand-muted group-hover:text-brand transition-colors">
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium text-ink group-hover:text-brand transition-colors leading-tight">{label}</span>
                      </Link>
                    ))}
                  </div>
                </section>

              </div>

              {/* ── Right column ──────────────────────────── */}
              <div className="space-y-6">

                {/* Recommended Pros */}
                <div className="bg-white border border-border-dim shadow-sm rounded-[24px] p-6 sm:p-8 sticky top-28">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-lg text-ink">
                      {activeCat && matchedPros.length > 0
                        ? `${activeCat} pros near you`
                        : 'Recommended Pros'}
                    </h3>
                    <Link href="/browse" className="text-sm font-medium text-brand hover:text-brand-dark transition-colors">
                      See all
                    </Link>
                  </div>

                  {displayPros.length === 0 ? (
                    <div className="space-y-2">
                      {[
                        { label: 'Electricians', slug: 'electrician', emoji: '⚡' },
                        { label: 'Plumbers',     slug: 'plumber',     emoji: '🔧' },
                        { label: 'Cleaners',     slug: 'cleaning',    emoji: '🧹' },
                      ].map(s => (
                        <Link
                          key={s.slug}
                          href={`/browse?category=${s.slug}`}
                          className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-alt transition-all group"
                        >
                          <div className="w-10 h-10 bg-canvas rounded-full flex items-center justify-center text-lg border border-border-dim">
                            {s.emoji}
                          </div>
                          <span className="text-sm font-medium text-ink-sub group-hover:text-ink transition-colors flex-1">{s.label}</span>
                          <ChevronRight className="w-4 h-4 text-ink-dim group-hover:text-ink-sub transition-colors shrink-0" />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {displayPros.slice(0, 4).map(pro => (
                        <Link
                          key={pro.id}
                          href={`/providers/${pro.id}`}
                          className="flex items-center gap-4 group"
                        >
                          <img 
                            src={pro.user?.image || `https://i.pravatar.cc/100?u=${pro.id}`} 
                            alt={pro.user?.name} 
                            className="w-12 h-12 rounded-full object-cover shadow-sm bg-surface-alt group-hover:ring-2 ring-brand/20 transition-all" 
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-ink truncate group-hover:text-brand transition-colors">{pro.user?.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {pro.ratingAvg && (
                                <span className="flex items-center gap-0.5 text-xs font-medium text-ink-sub">
                                  <Star className="w-3 h-3 text-brand fill-current" />
                                  {pro.ratingAvg.toFixed(1)}
                                </span>
                              )}
                              <span className="text-xs text-ink-dim truncate">
                                {pro.categories?.[0]?.name || 'Professional'}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {displayPros.length > 0 && (
                    <Link href="/browse" className="mt-8 w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-medium text-ink bg-surface-alt hover:bg-border transition-all">
                      Browse all professionals
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
