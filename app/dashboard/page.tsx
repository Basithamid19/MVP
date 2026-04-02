'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Calendar, CheckCircle2,
  ChevronRight, ChevronDown, Star, Loader2,
  Search, MapPin, Bell,
  Inbox, Users, Zap, ShieldCheck,
  Wrench, Hammer, Truck, Package
} from 'lucide-react';
import { BroomIcon, ElectricianIcon } from '@/components/icons';
import { avatarUrl } from '@/lib/avatar';
import Link from 'next/link';
import CustomerLayout from '@/components/CustomerLayout';

/* ─── Static ──────────────────────────────────────────────── */

const QUICK_JOBS = [
  { label: 'Plumbing',   slug: 'plumber',     Icon: Wrench },
  { label: 'Electrical', slug: 'electrician', Icon: ElectricianIcon },
  { label: 'Cleaning',   slug: 'cleaning',    Icon: BroomIcon },
  { label: 'Handyman',   slug: 'handyman',    Icon: Hammer },
  { label: 'Moving',     slug: 'moving-help',        Icon: Truck },
  { label: 'Furniture',  slug: 'furniture-assembly', Icon: Package },
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

/* ─── Helpers ─────────────────────────────────────────────── */

function capitalize(s?: string | null) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getJobAction(req: any): { label: string; primary: boolean } {
  const q = req.quotes?.length ?? 0;
  if (req.status === 'COMPLETED') return { label: 'Leave a Review',  primary: false };
  if (req.status === 'ACCEPTED')  return { label: 'View Booking',    primary: true };
  if (req.status === 'CHATTING')  return { label: 'Continue Chat',   primary: true };
  if (q > 0)                      return { label: `Review ${q} Quote${q > 1 ? 's' : ''}`, primary: true };
  return                                  { label: 'View Details',   primary: false };
}

function getCategoryIcon(slug?: string) {
  switch (slug) {
    case 'electrician': return <ElectricianIcon className="w-5 h-5 text-brand" />;
    case 'plumber':     return <Wrench className="w-5 h-5 text-brand" />;
    case 'cleaning':    return <BroomIcon className="w-5 h-5 text-brand" />;
    case 'handyman':    return <Hammer className="w-5 h-5 text-brand" />;
    case 'moving-help':        return <Truck className="w-5 h-5 text-brand" />;
    case 'furniture-assembly': return <Package className="w-5 h-5 text-brand" />;
    default:                   return <Inbox className="w-5 h-5 text-brand" />;
  }
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
      <div className="flex items-center justify-between px-0.5">
        {STEPPER_LABELS.map((label, i) => (
          <span key={label} className={`text-[10px] font-bold uppercase tracking-wide ${i <= step ? 'text-ink' : 'text-ink-dim'}`}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Collapsible Orders List ─────────────────────────────── */

function OrdersList({ requests }: { requests: any[] }) {
  const [openId, setOpenId] = useState<string | null>(requests[0]?.id ?? null);

  return (
    <div className="space-y-3">
      {requests.slice(0, 6).map(req => {
        const stage      = STATUS_STAGE[req.status] ?? { label: req.status, dot: 'bg-border', step: 0 };
        const quoteCount = req.quotes?.length ?? 0;
        const action     = getJobAction(req);
        const isBooked   = req.status === 'ACCEPTED';
        const topQuote   = req.quotes?.find((q: any) => q.provider) ?? req.quotes?.[0];
        const topPro     = topQuote?.provider;
        const isOpen     = openId === req.id;

        return (
          <div
            key={req.id}
            className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 ${
              isBooked ? 'border-brand/20 shadow-md' : 'border-border-dim shadow-card'
            }`}
          >
            {/* Collapsed header — always visible */}
            <button
              onClick={() => setOpenId(isOpen ? null : req.id)}
              className="w-full flex items-center gap-3 p-4 text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-brand-muted flex items-center justify-center shrink-0">
                {getCategoryIcon(req.category?.slug)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-ink-dim truncate">{req.category?.name}</span>
                  {req.isUrgent && <span className="flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-widest text-caution shrink-0"><Zap className="w-3 h-3" /> Urgent</span>}
                </div>
                <p className="font-semibold text-sm text-ink leading-snug truncate">{req.description}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Compact status on mobile */}
                <div className="flex items-center gap-1 sm:hidden">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${stage.dot}`} />
                  <span className="text-[10px] font-semibold text-ink-sub whitespace-nowrap max-w-[64px] truncate">{stage.label}</span>
                </div>
                {/* Full badge on sm+ */}
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-alt rounded-full border border-border-dim">
                  <span className={`w-1.5 h-1.5 rounded-full ${stage.dot}`} />
                  <span className="text-xs font-medium text-ink-sub whitespace-nowrap">{stage.label}</span>
                </span>
                <ChevronDown className={`w-4 h-4 text-ink-dim transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Expanded details */}
            {isOpen && (
              <div className="px-4 pb-5 sm:px-5 sm:pb-6 border-t border-border-dim pt-3">
                <div className="flex items-center mb-2.5 sm:hidden">
                  <StatusBadge status={req.status} />
                </div>
                <p className="flex items-center gap-1.5 text-sm text-ink-sub mb-3">
                  <MapPin className="w-4 h-4 shrink-0 text-ink-dim" /> {req.address}
                </p>

                <div className="py-2 mb-3">
                  <JobStepper step={stage.step} />
                </div>

                {quoteCount > 0 && topPro && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 bg-surface-alt rounded-2xl p-3.5 sm:p-4 border border-border-dim">
                    <div className="flex items-center gap-3">
                      <img
                        src={topPro.user?.image || avatarUrl(topPro.user?.name, 80)}
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
                          {topPro.isVerified && <span className="text-[11px] font-medium text-trust">✓ Verified</span>}
                        </div>
                      </div>
                    </div>
                    <div className="sm:text-right pl-12 sm:pl-0">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-ink-dim mb-0.5">Est. Price</p>
                      <p className="text-base font-semibold text-ink">€{topQuote.price}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-0.5">
                  <span className="text-xs text-ink-dim">
                    {quoteCount > 0
                      ? `${quoteCount} quote${quoteCount > 1 ? 's' : ''} received`
                      : 'Waiting for quotes…'
                    }
                  </span>
                  <Link
                    href={`/requests/${req.id}`}
                    className={`flex items-center gap-1 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shrink-0 ${
                      action.primary
                        ? 'bg-brand text-white hover:bg-brand-dark'
                        : 'bg-surface-alt text-ink hover:bg-border'
                    }`}
                  >
                    {action.label} <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {requests.length > 6 && (
        <div className="pt-2 text-center">
          <Link href="/requests" className="text-sm font-medium text-ink-sub hover:text-ink transition-colors">
            View all {requests.length} orders
          </Link>
        </div>
      )}
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
  const [mobileTab, setMobileTab]     = useState<'overview' | 'requests'>('overview');
  const [reqFilter, setReqFilter]     = useState<'active' | 'booked' | 'all'>('all');

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status !== 'authenticated') return;

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

    }).catch(console.error).finally(() => setLoading(false));
  }, [status, session, router]);

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <Loader2 className="w-8 h-8 animate-spin text-ink-dim" />
      </div>
    );
  }
  if (!session) return null;

  const firstName    = capitalize(session.user?.name?.split(' ')[0]);
  const pendingQuoteReqs = requests.filter((r: any) => r.quotes?.some((q: any) => q.status === 'PENDING'));
  const totalQuotes  = pendingQuoteReqs.reduce((s: number, r: any) => s + (r.quotes?.filter((q: any) => q.status === 'PENDING').length ?? 0), 0);
  const quotedReqs   = pendingQuoteReqs;
  const activeReqs   = requests.filter((r: any) => !['ACCEPTED','DECLINED','EXPIRED'].includes(r.status));
  const bookedReqs   = requests.filter((r: any) => r.status === 'ACCEPTED');
  const completedCt  = bookings.filter((b: any) => b.status === 'COMPLETED').length;
  const upcomingBook = bookings.find((b: any) => b.status === 'SCHEDULED');
  const needsReview  = bookings.find((b: any) => b.status === 'COMPLETED' && !b.review);

  const filteredRequests = reqFilter === 'active'
    ? requests.filter((r: any) => !['ACCEPTED','DECLINED','EXPIRED'].includes(r.status))
    : reqFilter === 'booked'
    ? requests.filter((r: any) => r.status === 'ACCEPTED')
    : requests;

  const handleTabSwitch = (tab: 'overview' | 'requests') => {
    setMobileTab(tab);
    if (tab === 'requests' && reqFilter === 'all') setReqFilter('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeCat   = requests[0]?.category?.name;
  const matchedPros = activeCat ? topPros.filter(p => p.categories?.some((c: any) => c.name === activeCat)) : [];
  const displayPros = matchedPros.length > 0 ? matchedPros : topPros;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <CustomerLayout>

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-brand mb-0.5">{greeting},</p>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{firstName}</h1>
        </div>
        <Link
          href="/requests/new"
          className="flex items-center gap-1.5 bg-brand text-white text-sm font-semibold px-4 py-2.5 rounded-full shadow-sm shrink-0"
        >
          <Search className="w-4 h-4" /> New request
        </Link>
      </div>

      {/* ── Mobile segmented control ── */}
      <div className="flex md:hidden bg-surface-alt border border-border-dim rounded-2xl p-1 mb-5">
        {(['overview', 'requests'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => handleTabSwitch(tab)}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
              mobileTab === tab
                ? 'bg-white text-brand shadow-card'
                : 'text-ink-sub'
            }`}
          >
            {tab === 'overview' ? 'Overview' : 'Requests'}
          </button>
        ))}
      </div>

      {/* ── Overview content (mobile: only when Overview tab active; desktop: always visible) ── */}
      <div className={mobileTab !== 'overview' ? 'hidden md:block' : ''}>
        {/* ── Stats strip ── */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {[
            { value: activeReqs.length, label: 'Active',    highlight: false },
            { value: totalQuotes,       label: 'Quotes',    highlight: totalQuotes > 0 },
            { value: completedCt,       label: 'Completed', highlight: false },
          ].map(({ value, label, highlight }) => (
            <div key={label} className={`rounded-2xl p-3.5 text-center border ${highlight ? 'bg-brand-muted border-brand/25' : 'bg-white border-border-dim'}`}>
              <p className={`text-xl font-bold ${highlight ? 'text-brand' : 'text-ink'}`}>{value}</p>
              <p className={`text-[10px] font-semibold uppercase tracking-wider mt-1 ${highlight ? 'text-brand/70' : 'text-ink-dim'}`}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── Action cards ── */}
        {(quotedReqs.length > 0 || upcomingBook || needsReview) && (
          <div className="flex flex-col gap-3 mb-5">
            {quotedReqs[0] && (
              <Link href={`/requests/${quotedReqs[0].id}`}
                className="flex items-center gap-3.5 bg-brand text-white rounded-2xl px-4 py-4">
                <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">{totalQuotes} new quote{totalQuotes > 1 ? 's' : ''} received</p>
                  <p className="text-xs text-white/70 truncate mt-0.5">{quotedReqs[0].category?.name} · tap to review</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/70 shrink-0" />
              </Link>
            )}
            {upcomingBook && (
              <Link href={`/bookings/${upcomingBook.id}`}
                className="flex items-center gap-3.5 bg-white border border-brand/20 rounded-2xl px-4 py-4">
                <div className="w-10 h-10 bg-brand-muted rounded-xl flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink">Upcoming booking</p>
                  <p className="text-xs text-ink-sub mt-0.5">
                    {new Date(upcomingBook.scheduledAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {upcomingBook.totalAmount ? ` · €${upcomingBook.totalAmount.toFixed(0)}` : ''}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-dim shrink-0" />
              </Link>
            )}
            {needsReview && !upcomingBook && (
              <Link href={`/bookings/${needsReview.id}`}
                className="flex items-center gap-3.5 bg-white border border-border-dim rounded-2xl px-4 py-4">
                <div className="w-10 h-10 bg-brand-muted rounded-xl flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 text-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink">Leave a review</p>
                  <p className="text-xs text-ink-sub mt-0.5">Your job was completed · share your experience</p>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-dim shrink-0" />
              </Link>
            )}
          </div>
        )}

        {/* ── Mobile Overview: quick-access to requests ── */}
        {requests.length > 0 && (
          <button
            onClick={() => handleTabSwitch('requests')}
            className="w-full flex items-center justify-between bg-white border border-border-dim rounded-2xl px-4 py-4 mb-5 md:hidden"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-surface-alt rounded-xl flex items-center justify-center shrink-0">
                <Inbox className="w-5 h-5 text-ink-sub" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-ink">Your requests</p>
                <p className="text-xs text-ink-sub mt-0.5">{activeReqs.length} active · {requests.length} total</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-ink-dim shrink-0" />
          </button>
        )}
      </div>

      {/* ── Requests content (mobile: only when Requests tab active; desktop: always visible) ── */}
      <div className={mobileTab !== 'requests' ? 'hidden md:block' : ''}>

        {/* ── Mobile filter pills ── */}
        <div className="flex gap-2 mb-4 md:hidden">
          {(['active', 'booked', 'all'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setReqFilter(filter)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${
                reqFilter === filter
                  ? 'bg-brand text-white'
                  : 'bg-white border border-border-dim text-ink-sub'
              }`}
            >
              {filter === 'active' ? `Active (${activeReqs.length})`
                : filter === 'booked' ? `Booked (${bookedReqs.length})`
                : `All (${requests.length})`}
            </button>
          ))}
        </div>

        {/* ── Main layout ── */}
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Orders */}
          <div className="w-full lg:col-span-2">
            {/* Desktop heading (hidden on mobile since tab label is visible) */}
            <div className="hidden md:flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold tracking-tight text-ink">My Orders</h2>
              {requests.length > 0 && (
                <span className="text-xs text-ink-dim">{requests.length} total</span>
              )}
            </div>

            {/* Mobile: use filtered list; Desktop: show all */}
            <div className="md:hidden">
              {filteredRequests.length === 0 ? (
                <div className="bg-white rounded-2xl border border-border-dim p-8 text-center">
                  <div className="w-12 h-12 bg-surface-alt rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Inbox className="w-5 h-5 text-ink-dim" />
                  </div>
                  <h3 className="text-base font-bold text-ink mb-1">
                    {reqFilter === 'active' ? 'No active requests' : reqFilter === 'booked' ? 'No booked requests' : 'No requests yet'}
                  </h3>
                  <p className="text-sm text-ink-sub mb-5 max-w-xs mx-auto">
                    {reqFilter === 'active'
                      ? 'New requests will appear here once posted.'
                      : reqFilter === 'booked'
                      ? 'Booked jobs from accepted quotes will show up here.'
                      : 'Post your first job and get quotes from verified professionals.'}
                  </p>
                  {requests.length === 0 && (
                    <Link href="/requests/new" className="inline-flex items-center gap-2 bg-brand text-white px-6 py-2.5 rounded-full text-sm font-semibold">
                      <Search className="w-4 h-4" /> Post a job
                    </Link>
                  )}
                </div>
              ) : (
                <OrdersList requests={filteredRequests} />
              )}
            </div>

            {/* Desktop: original unfiltered view */}
            <div className="hidden md:block">
              {requests.length === 0 ? (
                <div className="bg-white rounded-2xl border border-border-dim p-8 sm:p-10 text-center">
                  <div className="w-12 h-12 bg-surface-alt rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Inbox className="w-5 h-5 text-ink-dim" />
                  </div>
                  <h3 className="text-base font-bold text-ink mb-1">No active projects yet</h3>
                  <p className="text-sm text-ink-sub mb-5 max-w-xs mx-auto">Post your first job and get quotes from verified professionals in Vilnius.</p>
                  <Link href="/requests/new" className="inline-flex items-center gap-2 bg-brand text-white px-6 py-2.5 rounded-full text-sm font-semibold">
                    <Search className="w-4 h-4" /> Post a job
                  </Link>
                </div>
              ) : (
                <OrdersList requests={requests} />
              )}
            </div>
          </div>

        {/* Desktop right: Recommended Pros */}
        <div className="hidden lg:block space-y-6">
          <section className="sticky top-28">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold tracking-tight text-ink">
                {activeCat && matchedPros.length > 0 ? `${activeCat} pros` : 'Recommended Pros'}
              </h2>
              <Link href="/browse" className="text-sm font-medium text-brand hover:text-brand-dark transition-colors">See all</Link>
            </div>
            <div className="bg-white border border-border-dim shadow-sm rounded-2xl p-5 space-y-4">
              {displayPros.slice(0, 4).map(pro => (
                <Link key={pro.id} href={`/providers/${pro.id}`} className="flex items-center gap-3 group">
                  <img src={pro.user?.image || avatarUrl(pro.user?.name, 80)} alt={pro.user?.name}
                    className="w-10 h-10 rounded-full object-cover bg-surface-alt shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink truncate group-hover:text-brand transition-colors">{pro.user?.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {pro.ratingAvg && (
                        <span className="flex items-center gap-0.5 text-xs text-ink-sub">
                          <Star className="w-3 h-3 text-brand fill-current" />{pro.ratingAvg.toFixed(1)}
                        </span>
                      )}
                      <span className="text-xs text-ink-dim">{pro.categories?.[0]?.name}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-dim shrink-0" />
                </Link>
              ))}
              <Link href="/browse" className="block text-center text-sm font-semibold text-brand pt-2 border-t border-border-dim mt-2">
                Browse all pros
              </Link>
            </div>
          </section>
        </div>
      </div>
      </div>
    </CustomerLayout>
  );
}
