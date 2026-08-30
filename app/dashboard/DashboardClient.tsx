'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Calendar, ChevronRight, ChevronDown, Star,
  Search, MapPin, Inbox, Users, Zap,
  Wrench, Hammer, Truck, Package
} from 'lucide-react';
import { BroomIcon, ElectricianIcon } from '@/components/icons';
import {
  Avatar, Card, DomainStatusBadge, EmptyState,
  SkeletonCard, SkeletonStat, StatCard, buttonVariants,
} from '@/components/ui';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
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

// Labels + badge colors come from the design-system DomainStatusBadge; this map
// only carries the dashboard-specific stepper position. (The old map also had a
// bogus COMPLETED entry — ServiceRequestStatus has no such value.)
const STATUS_STEP: Record<string, number> = {
  NEW:      0,
  QUOTED:   1,
  CHATTING: 1,
  ACCEPTED: 2,
  DECLINED: -1,
  EXPIRED:  -1,
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
  // Chat is deposit-gated, so "Continue Chat" was a dead end pre-booking.
  if (req.status === 'CHATTING')  return { label: 'View Request',    primary: true };
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

const STEPPER_LABELS = ['Posted', 'Quotes', 'Booked', 'Done'];

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
          <span key={label} className={`text-3xs font-bold uppercase tracking-wide ${i <= step ? 'text-ink' : 'text-ink-dim'}`}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Collapsible Orders List ─────────────────────────────── */

function OrdersList({ requests }: { requests: any[] }) {
  const t = useTranslation();
  const [openId, setOpenId] = useState<string | null>(requests[0]?.id ?? null);

  return (
    <div className="space-y-3">
      {requests.slice(0, 6).map(req => {
        const step       = STATUS_STEP[req.status] ?? 0;
        const quoteCount = req.quotes?.length ?? 0;
        const action     = getJobAction(req);
        const isBooked   = req.status === 'ACCEPTED';
        const topQuote   = req.quotes?.find((q: any) => q.provider) ?? req.quotes?.[0];
        const topPro     = topQuote?.provider;
        const isOpen     = openId === req.id;

        return (
          <Card
            key={req.id}
            padding="none"
            className={cn(
              'overflow-hidden transition-all duration-150',
              isBooked && 'border-brand/20 shadow-elevated',
            )}
          >
            {/* Collapsed header — always visible */}
            <button
              onClick={() => setOpenId(isOpen ? null : req.id)}
              className="w-full flex items-center gap-3 p-4 text-left"
            >
              <div className="w-9 h-9 rounded-input bg-brand-muted flex items-center justify-center shrink-0">
                {getCategoryIcon(req.category?.slug)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-3xs font-bold uppercase tracking-widest text-ink-dim truncate">{req.category?.name}</span>
                  {req.isUrgent && <span className="flex items-center gap-0.5 text-3xs font-bold uppercase tracking-widest text-caution shrink-0"><Zap className="w-3 h-3" /> Urgent</span>}
                </div>
                <p className="font-semibold text-sm text-ink leading-snug truncate">{req.description}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {/* One badge, all breakpoints — the design-system domain badge */}
                <DomainStatusBadge kind="request" status={req.status} dict={t} dot />
                <ChevronDown className={`w-4 h-4 text-ink-dim transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Expanded details */}
            {isOpen && (
              <div className="px-4 pb-5 sm:px-5 sm:pb-6 border-t border-border-dim pt-3">
                <p className="flex items-center gap-1.5 text-sm text-ink-sub mb-3">
                  <MapPin className="w-4 h-4 shrink-0 text-ink-dim" /> {req.address}
                </p>

                <div className="py-2 mb-3">
                  <JobStepper step={step} />
                </div>

                {quoteCount > 0 && topPro && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 bg-surface-alt rounded-card p-3.5 sm:p-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={topPro.user?.image} name={topPro.user?.name ?? ''} size="md" />
                      <div>
                        <p className="text-sm font-semibold text-ink leading-none mb-1.5">{topPro.user?.name}</p>
                        <div className="flex items-center gap-2">
                          {topPro.ratingAvg && (
                            <span className="flex items-center gap-0.5 text-xs font-medium text-ink-sub">
                              <Star className="w-3 h-3 text-brand fill-current" />
                              {topPro.ratingAvg.toFixed(1)}
                            </span>
                          )}
                          {topPro.isVerified && <span className="text-2xs font-medium text-trust">✓ {t.common.verified}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="sm:text-right pl-13 sm:pl-0">
                      <p className="text-2xs font-bold uppercase tracking-widest text-ink-dim mb-0.5">Est. Price</p>
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
                    className={buttonVariants({
                      variant: action.primary ? 'primary' : 'secondary',
                      size: 'sm',
                    })}
                  >
                    {action.label} <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </Card>
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

export default function DashboardPage({
  initialRequests = [],
  initialBookings = [],
}: {
  initialRequests?: any[];
  initialBookings?: any[];
} = {}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const hasInitial = initialRequests.length > 0 || initialBookings.length > 0;
  const [requests, setRequests]       = useState<any[]>(initialRequests);
  const [bookings, setBookings]       = useState<any[]>(initialBookings);
  const [topPros, setTopPros]         = useState<any[]>([]);
  const [loading, setLoading]         = useState(!hasInitial);
  const [mobileTab, setMobileTab]     = useState<'overview' | 'requests'>('overview');
  const [reqFilter, setReqFilter]     = useState<'active' | 'booked' | 'all'>('all');

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status !== 'authenticated') return;

    // Top pros comes from the edge-cached /api/providers — cheap, fire it
    // regardless of whether we got initial data from the server.
    fetch('/api/providers')
      .then(r => r.json())
      .then(prosData => {
        setTopPros(Array.isArray(prosData) ? prosData.slice(0, 4) : []);
      })
      .catch(() => {});

    // Server already rendered us with requests/bookings — skip the refetch.
    if (hasInitial) { setLoading(false); return; }

    Promise.all([
      fetch('/api/requests').then(r => r.json()),
      fetch('/api/bookings').then(r => r.json()),
    ]).then(([reqData, bookData]) => {
      setRequests(Array.isArray(reqData)  ? reqData  : []);
      setBookings(Array.isArray(bookData) ? bookData : []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [status, session, router, hasInitial]);

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <CustomerLayout>
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {[0, 1, 2].map(i => <SkeletonStat key={i} className="p-3.5 sm:p-5" />)}
        </div>
        <div className="space-y-3">
          {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
        </div>
      </CustomerLayout>
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">{firstName}</h1>
        </div>
        <Link href="/requests/new" className={buttonVariants({ variant: 'primary', size: 'md' })}>
          <Search className="w-4 h-4" /> New request
        </Link>
      </div>

      {/* ── Mobile segmented control ── */}
      <div className="flex md:hidden bg-surface-alt border border-border-dim rounded-card p-1 mb-5">
        {(['overview', 'requests'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => handleTabSwitch(tab)}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-input transition-all duration-150 ${
              mobileTab === tab
                ? 'bg-card text-brand shadow-card'
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
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-5">
          {[
            { value: activeReqs.length, label: 'Active',    highlight: false },
            { value: totalQuotes,       label: 'Quotes',    highlight: totalQuotes > 0 },
            { value: completedCt,       label: 'Completed', highlight: false },
          ].map(({ value, label, highlight }) => (
            <StatCard
              key={label}
              label={label}
              value={value}
              className={cn('p-3.5 sm:p-5', highlight && 'bg-brand-muted border-brand/25')}
            />
          ))}
        </div>

        {/* ── Action cards ── */}
        {(quotedReqs.length > 0 || upcomingBook || needsReview) && (
          <div className="flex flex-col gap-3 mb-5">
            {quotedReqs[0] && (
              <Link href={`/requests/${quotedReqs[0].id}`}
                className="flex items-center gap-3.5 bg-brand text-white rounded-card px-4 py-4 shadow-card transition-all duration-150 hover:shadow-elevated">
                <div className="w-10 h-10 bg-card/15 rounded-input flex items-center justify-center shrink-0">
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
                className="flex items-center gap-3.5 bg-card border border-brand/20 rounded-card px-4 py-4 shadow-card transition-all duration-150 hover:shadow-elevated">
                <div className="w-10 h-10 bg-brand-muted rounded-input flex items-center justify-center shrink-0">
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
                className="flex items-center gap-3.5 bg-card border border-border-dim rounded-card px-4 py-4 shadow-card transition-all duration-150 hover:shadow-elevated">
                <div className="w-10 h-10 bg-brand-muted rounded-input flex items-center justify-center shrink-0">
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
            className="w-full flex items-center justify-between bg-card border border-border-dim rounded-card px-4 py-4 mb-5 shadow-card md:hidden"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-surface-alt rounded-input flex items-center justify-center shrink-0">
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
              className={cn(
                buttonVariants({ variant: reqFilter === filter ? 'primary' : 'secondary', size: 'sm' }),
                'uppercase tracking-wide',
              )}
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

            {/* One list, one empty state — the filter pills above are the only
                thing that varies by breakpoint (they're mobile-only, so at
                desktop widths reqFilter stays 'all' and every order shows). */}
            {filteredRequests.length === 0 ? (
              <Card padding="lg" className="sm:p-10">
                <EmptyState
                  icon={Inbox}
                  title={
                    reqFilter === 'active' ? 'No active requests'
                      : reqFilter === 'booked' ? 'No booked requests'
                      : 'No requests yet'
                  }
                  description={
                    reqFilter === 'active'
                      ? 'New requests will appear here once posted.'
                      : reqFilter === 'booked'
                      ? 'Booked jobs from accepted quotes will show up here.'
                      : 'Post your first job and get quotes from verified professionals in Vilnius.'
                  }
                  size="lg"
                  action={requests.length === 0 ? (
                    <Link href="/requests/new" className={buttonVariants({ variant: 'primary', size: 'md' })}>
                      <Search className="w-4 h-4" /> Post a job
                    </Link>
                  ) : undefined}
                />
              </Card>
            ) : (
              <OrdersList requests={filteredRequests} />
            )}
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
            <Card padding="md" className="space-y-4">
              {displayPros.slice(0, 4).map(pro => (
                <Link key={pro.id} href={`/providers/${pro.id}`} className="flex items-center gap-3 group">
                  <Avatar src={pro.user?.image} name={pro.user?.name ?? ''} size="md" />
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
            </Card>
          </section>
        </div>
      </div>
      </div>
    </CustomerLayout>
  );
}
