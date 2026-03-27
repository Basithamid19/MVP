'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Calendar, CheckCircle2,
  ChevronRight, ChevronDown, Star, Loader2,
  Search, MapPin, Bell,
  Inbox, Users, Zap, ShieldCheck,
  Wrench, Hammer, Truck, Paintbrush
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
    case 'moving-help': return <Truck className="w-5 h-5 text-brand" />;
    case 'painting':    return <Paintbrush className="w-5 h-5 text-brand" />;
    default:            return <Inbox className="w-5 h-5 text-brand" />;
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
              isBooked ? 'border-brand/20 shadow-md' : 'border-border-dim shadow-sm'
            }`}
          >
            {/* Collapsed header — always visible */}
            <button
              onClick={() => setOpenId(isOpen ? null : req.id)}
              className="w-full flex items-center gap-3 p-3 sm:p-4 text-left"
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
                {/* Dot only on mobile, full badge on sm+ */}
                <span className={`w-2 h-2 rounded-full sm:hidden ${stage.dot}`} />
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-alt rounded-full border border-border-dim">
                  <span className={`w-1.5 h-1.5 rounded-full ${stage.dot}`} />
                  <span className="text-xs font-medium text-ink-sub whitespace-nowrap">{stage.label}</span>
                </span>
                <ChevronDown className={`w-4 h-4 text-ink-dim transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Expanded details */}
            {isOpen && (
              <div className="px-3 pb-4 sm:px-5 sm:pb-6 border-t border-border-dim pt-3">
                <div className="flex items-center justify-between mb-3 sm:hidden">
                  <StatusBadge status={req.status} />
                </div>
                <p className="flex items-center gap-1.5 text-sm text-ink-sub mb-4">
                  <MapPin className="w-4 h-4 shrink-0 text-ink-dim" /> {req.address}
                </p>

                <div className="py-3 mb-4 border-y border-border-dim">
                  <JobStepper step={stage.step} />
                </div>

                {quoteCount > 0 && topPro && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-surface-alt rounded-xl p-4 border border-border-dim">
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

                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    {quoteCount > 0
                      ? <span className="text-ink font-semibold">{quoteCount} quote{quoteCount > 1 ? 's' : ''}</span>
                      : <span className="text-ink-dim">Waiting for professionals...</span>
                    }
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
  const [notifications, setNotifications] = useState<Notification[]>([]);

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

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <Loader2 className="w-8 h-8 animate-spin text-ink-dim" />
      </div>
    );
  }
  if (!session) return null;

  const firstName     = capitalize(session.user?.name?.split(' ')[0]);
  const totalQuotes   = requests.reduce((s: number, r: any) => s + (r.quotes?.length ?? 0), 0);
  const quotedReqs    = requests.filter((r: any) => (r.quotes?.length ?? 0) > 0);
  const activeCat     = requests[0]?.category?.name;

  const matchedPros = activeCat
    ? topPros.filter(p => p.categories?.some((c: any) => c.name === activeCat))
    : [];
  const displayPros = matchedPros.length > 0 ? matchedPros : topPros;

  const showQuotesBanner = totalQuotes > 0 && !!quotedReqs[0];

  return (
    <CustomerLayout notifications={notifications}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 mb-6 sm:mb-8 relative">
        <div className="relative z-10">
          <p className="text-sm font-medium text-brand mb-1">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},</p>
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-ink mb-1 sm:mb-2">{firstName}</h1>
          <p className="text-ink-sub text-sm sm:text-base">Here is what&apos;s happening with your home projects.</p>
        </div>
        <Link
          href="/requests/new"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand text-white px-7 py-4 sm:py-3.5 rounded-full text-base sm:text-sm font-medium hover:bg-brand-dark transition-all shadow-sm hover:shadow-md shrink-0 relative z-10"
        >
          <Search className="w-5 h-5 sm:w-4 sm:h-4" /> Find a Pro
        </Link>
      </div>

      {/* Priority Banner */}
      {showQuotesBanner && (
        <div className="relative overflow-hidden bg-brand text-white rounded-2xl sm:rounded-panel p-5 sm:p-8 mb-8 sm:mb-10 shadow-md sm:shadow-elevated flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
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

      {/* Main layout */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-3 lg:gap-8">
        {/* Left: My Orders */}
        <div className="w-full lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold tracking-tight text-ink">My Orders</h2>
              {requests.length > 0 && (
                <span className="text-sm text-ink-dim font-medium">{requests.length} active</span>
              )}
            </div>

            {requests.length === 0 ? (
              <div className="bg-white rounded-2xl sm:rounded-panel border border-border-dim p-8 sm:p-16 text-center shadow-sm">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-canvas rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-border-dim">
                  <Inbox className="w-6 h-6 sm:w-8 sm:h-8 text-ink-dim" />
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-ink mb-2 sm:mb-3">No active projects</h3>
                <p className="text-sm sm:text-base text-ink-sub mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed">
                  Ready to tackle your next home project? Describe what you need done and get quotes from verified Vilnius professionals.
                </p>
                <Link href="/requests/new" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand text-white px-8 py-3.5 sm:py-4 rounded-full text-sm font-medium hover:bg-brand-dark transition-all shadow-sm hover:shadow-md">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" /> Find a Pro
                </Link>
              </div>
            ) : (
              <OrdersList requests={requests} />
            )}
          </section>

          {/* Browse Services */}
          <section className="pt-6">
            <h2 className="text-xl font-semibold tracking-tight text-ink mb-6">Browse Services</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {QUICK_JOBS.map(({ label, slug, Icon }) => (
                <Link
                  key={slug}
                  href={`/browse?category=${slug}`}
                  className="bg-white border border-border-dim shadow-sm rounded-2xl p-4 flex flex-col items-center justify-center text-center active:scale-[0.97] transition-transform"
                >
                  <div className="w-14 h-14 bg-brand-muted rounded-2xl flex items-center justify-center mb-4 shrink-0">
                    <Icon className="w-7 h-7 text-brand" strokeWidth={1.5} />
                  </div>
                  <span className="text-xs font-semibold text-ink leading-tight">{label}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Right column — desktop only */}
        <div className="hidden lg:block space-y-6">
          <section className="sticky top-28">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold tracking-tight text-ink">
                {activeCat && matchedPros.length > 0
                  ? `${activeCat} pros near you`
                  : 'Recommended Pros'}
              </h2>
              <Link href="/browse" className="text-sm font-medium text-brand hover:text-brand-dark transition-colors">
                See all
              </Link>
            </div>

            <div className="bg-white border border-border-dim shadow-sm rounded-2xl sm:rounded-panel p-5 sm:p-8">
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
                        src={pro.user?.image || avatarUrl(pro.user?.name, 100)}
                        alt={pro.user?.name}
                        className="w-12 h-12 rounded-full object-cover shadow-sm bg-surface-alt group-hover:ring-2 ring-brand/20 transition-all"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-ink truncate group-hover:text-brand transition-colors">{pro.user?.name}</p>
                          {pro.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-trust shrink-0" />}
                        </div>
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
          </section>
        </div>
      </div>
    </CustomerLayout>
  );
}
