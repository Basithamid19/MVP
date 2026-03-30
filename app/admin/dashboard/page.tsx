'use client';

import { AladdinIcon } from '@/components/icons';
import React, { useState, useEffect, useCallback } from 'react';
import { signOut } from 'next-auth/react';
import {
  BarChart3, ShieldCheck, Briefcase, AlertTriangle, Star,
  Settings, Users, FileWarning, LogOut, CheckCircle2,
  XCircle, Loader2, TrendingUp, Eye, EyeOff, Plus,
  Clock, DollarSign, Package, Activity, RefreshCcw,
  ChevronRight, MessageSquare, ArrowUpRight, X, Tag, Menu,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ModuleLoader() {
  return (
    <div className="flex items-center justify-center h-48">
      <Loader2 className="w-6 h-6 animate-spin text-ink-dim" />
    </div>
  );
}

function ModuleHeader({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-5 sm:mb-6">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">{title}</h1>
        <p className="text-ink-dim text-xs sm:text-sm mt-0.5">{description}</p>
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
}

function Badge({ color, label }: { color: string; label: string }) {
  const colors: Record<string, string> = {
    green: 'bg-trust-surface text-trust border border-trust-edge',
    red: 'bg-danger-surface text-danger border border-danger-edge',
    blue: 'bg-info-surface text-info border border-info-edge',
    orange: 'bg-caution-surface text-caution border border-caution-edge',
    gray: 'bg-surface-alt text-ink-dim border border-border-dim',
    yellow: 'bg-caution-surface text-caution border border-caution-edge',
    purple: 'bg-brand-muted text-brand-dark border border-brand/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-chip text-[11px] font-semibold uppercase tracking-wide ${colors[color] || colors.gray}`}>
      {label}
    </span>
  );
}

function AdminEmpty({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-11 h-11 bg-surface-alt rounded-xl flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-ink-dim/60" />
      </div>
      <p className="text-sm font-semibold text-ink mb-0.5">{title}</p>
      {description && <p className="text-xs text-ink-dim max-w-xs">{description}</p>}
    </div>
  );
}

function FilterChip({ label, active, count, onClick }: { label: string; active: boolean; count?: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        active
          ? 'bg-ink text-white shadow-sm'
          : 'bg-white border border-border-dim text-ink-sub hover:border-border hover:text-ink'
      }`}
    >
      {label}{count != null ? ` (${count})` : ''}
    </button>
  );
}

const TIER_COLORS: Record<string, string> = {
  TIER0_BASIC: 'gray',
  TIER1_ID_VERIFIED: 'blue',
  TIER2_TRADE_VERIFIED: 'purple',
  TIER3_ENHANCED: 'green',
};

const TIER_LABELS: Record<string, string> = {
  TIER0_BASIC: 'Tier 0',
  TIER1_ID_VERIFIED: 'Tier 1 – ID',
  TIER2_TRADE_VERIFIED: 'Tier 2 – Trade',
  TIER3_ENHANCED: 'Tier 3 – Enhanced',
};

// ─── Module 1: Analytics Dashboard ───────────────────────────────────────────

const chartData = [
  { name: 'Mon', requests: 4, bookings: 2 },
  { name: 'Tue', requests: 7, bookings: 4 },
  { name: 'Wed', requests: 5, bookings: 3 },
  { name: 'Thu', requests: 9, bookings: 6 },
  { name: 'Fri', requests: 12, bookings: 8 },
  { name: 'Sat', requests: 6, bookings: 5 },
  { name: 'Sun', requests: 3, bookings: 2 },
];

function AnalyticsModule() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin?section=overview')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <ModuleLoader />;
  const s = data?.stats ?? {};
  const pendingCount = (data?.pendingVerifications ?? []).length;
  const canceledCount = s.canceledBookings ?? 0;
  const cancellationRate = s.cancellationRate ?? 0;

  // Action items derived from real data
  const actions = [
    pendingCount > 0 && { label: `${pendingCount} provider${pendingCount > 1 ? 's' : ''} awaiting approval`, color: 'text-caution', bg: 'bg-caution-surface', icon: ShieldCheck },
    canceledCount > 0 && { label: `${canceledCount} cancelled booking${canceledCount > 1 ? 's' : ''} to review`, color: 'text-danger', bg: 'bg-danger-surface', icon: AlertTriangle },
    cancellationRate > 15 && { label: `Cancellation rate at ${cancellationRate}% — above threshold`, color: 'text-danger', bg: 'bg-danger-surface', icon: XCircle },
    (s.quoteRate ?? 0) < 30 && (s.totalRequests ?? 0) > 0 && { label: `Quote rate low at ${s.quoteRate}% — supply may be thin`, color: 'text-caution', bg: 'bg-caution-surface', icon: MessageSquare },
  ].filter(Boolean) as { label: string; color: string; bg: string; icon: React.ElementType }[];

  // Primary KPIs — key decision metrics
  const primaryKpis = [
    { label: 'Requests', value: s.totalRequests ?? 0, icon: Package, accent: 'bg-info-surface text-info' },
    { label: 'GMV', value: `€${(s.gmv ?? 0).toFixed(0)}`, icon: DollarSign, accent: 'bg-trust-surface text-trust' },
    { label: 'Conversion', value: `${s.conversionRate ?? 0}%`, icon: TrendingUp, accent: 'bg-brand-muted text-brand' },
    { label: 'Quote Rate', value: `${s.quoteRate ?? 0}%`, icon: MessageSquare, accent: 'bg-caution-surface text-caution' },
  ];

  // Secondary KPIs — context metrics
  const secondaryKpis = [
    { label: 'Cancellation', value: `${s.cancellationRate ?? 0}%` },
    { label: 'Providers', value: s.totalProviders ?? 0 },
    { label: 'Users', value: s.totalUsers ?? 0 },
    { label: 'Reviews', value: s.totalReviews ?? 0 },
  ];

  // Marketplace health derived from available data
  const completionRate = (s.totalBookings ?? 0) > 0
    ? Math.round(((s.completedBookings ?? 0) / s.totalBookings) * 100)
    : 0;
  const supplyRatio = (s.totalRequests ?? 0) > 0
    ? ((s.totalProviders ?? 0) / s.totalRequests).toFixed(1)
    : '—';

  return (
    <div>
      <ModuleHeader title="Command Center" description="Marketplace overview and operational health." />

      {/* ── Action Needed ── */}
      {actions.length > 0 && (
        <div className="mb-5">
          <p className="text-[11px] font-bold text-ink-dim uppercase tracking-widest mb-2">Action needed</p>
          <div className="space-y-1.5">
            {actions.map((a, i) => (
              <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl ${a.bg}`}>
                <a.icon className={`w-3.5 h-3.5 shrink-0 ${a.color}`} />
                <span className={`text-xs font-semibold ${a.color}`}>{a.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Primary KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        {primaryKpis.map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-border-dim p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 ${k.accent} rounded-lg flex items-center justify-center`}>
                <k.icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-semibold text-ink-dim uppercase tracking-wide">{k.label}</span>
            </div>
            <div className="text-2xl font-bold tracking-tight tabular-nums">{k.value}</div>
          </div>
        ))}
      </div>

      {/* ── Secondary KPIs ── */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {secondaryKpis.map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-border-dim px-3 py-3 text-center">
            <div className="text-lg font-bold tabular-nums text-ink">{k.value}</div>
            <div className="text-[10px] font-semibold text-ink-dim uppercase tracking-wide mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── Marketplace Activity Chart ── */}
      <div className="bg-white rounded-xl border border-border-dim p-4 sm:p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-sm text-ink">Weekly Activity</h2>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-ink rounded-sm" /><span className="text-[10px] font-semibold text-ink-dim uppercase tracking-wide">Requests</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-border rounded-sm" /><span className="text-[10px] font-semibold text-ink-dim uppercase tracking-wide">Bookings</span></div>
          </div>
        </div>
        <div className="h-44 sm:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} width={28} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', fontSize: '12px' }} />
              <Bar dataKey="requests" fill="#1a1f2e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="bookings" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Marketplace Health ── */}
      <div className="bg-white rounded-xl border border-border-dim p-4 sm:p-5">
        <h2 className="font-bold text-sm text-ink mb-3">Marketplace Health</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="px-3 py-2.5 rounded-lg bg-surface-alt">
            <p className="text-[10px] font-semibold text-ink-dim uppercase tracking-wide">Demand</p>
            <p className="text-sm font-bold text-ink mt-0.5">{s.totalRequests ?? 0} requests</p>
            <p className="text-[11px] text-ink-dim">{s.totalBookings ?? 0} converted to bookings</p>
          </div>
          <div className="px-3 py-2.5 rounded-lg bg-surface-alt">
            <p className="text-[10px] font-semibold text-ink-dim uppercase tracking-wide">Supply</p>
            <p className="text-sm font-bold text-ink mt-0.5">{s.totalProviders ?? 0} providers</p>
            <p className="text-[11px] text-ink-dim">{supplyRatio} providers per request</p>
          </div>
          <div className="px-3 py-2.5 rounded-lg bg-surface-alt">
            <p className="text-[10px] font-semibold text-ink-dim uppercase tracking-wide">Fulfilment</p>
            <p className="text-sm font-bold text-ink mt-0.5">{completionRate}% completed</p>
            <p className="text-[11px] text-ink-dim">{canceledCount} cancelled</p>
          </div>
          <div className="px-3 py-2.5 rounded-lg bg-surface-alt">
            <p className="text-[10px] font-semibold text-ink-dim uppercase tracking-wide">Trust</p>
            <p className="text-sm font-bold text-ink mt-0.5">{s.totalReviews ?? 0} reviews</p>
            <p className="text-[11px] text-ink-dim">{pendingCount} pending verification{pendingCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Module 2: Provider Approval Queue ───────────────────────────────────────

function ProvidersModule() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/admin?section=providers')
      .then(r => r.json())
      .then(d => { setProviders(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = async (providerId: string, isVerified: boolean, verificationTier?: string) => {
    await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_provider', providerId, isVerified, verificationTier }),
    });
    load();
  };

  if (loading) return <ModuleLoader />;

  const needsReview = providers.filter(p => !p.isVerified);
  const approved = providers.filter(p => p.isVerified);
  const filtered = filter === 'ALL' ? providers
    : filter === 'NEEDS_REVIEW' ? needsReview
    : approved;

  return (
    <div>
      <ModuleHeader
        title="Provider Queue"
        description="Review trust status, approve, suspend, or change provider tiers."
        action={<button onClick={load} className="p-2 rounded-lg hover:bg-surface-alt transition-colors"><RefreshCcw className="w-4 h-4 text-ink-dim" /></button>}
      />

      {/* Summary strip */}
      <div className="flex items-center gap-4 mb-4 text-xs text-ink-dim">
        <span><span className="font-bold text-ink tabular-nums">{providers.length}</span> total</span>
        {needsReview.length > 0 && <span className="text-caution font-semibold">{needsReview.length} needs review</span>}
        <span><span className="font-bold text-ink tabular-nums">{approved.length}</span> approved</span>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        <FilterChip label="All" active={filter === 'ALL'} count={providers.length} onClick={() => setFilter('ALL')} />
        <FilterChip label="Needs Review" active={filter === 'NEEDS_REVIEW'} count={needsReview.length} onClick={() => setFilter('NEEDS_REVIEW')} />
        <FilterChip label="Approved" active={filter === 'APPROVED'} count={approved.length} onClick={() => setFilter('APPROVED')} />
      </div>

      {filtered.length === 0 ? <AdminEmpty icon={ShieldCheck} title="No providers match this filter" description="Providers will appear here once they register on the platform." /> : (
        <div className="space-y-2.5">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-border-dim p-4">
              {/* Identity row */}
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={p.user.image || `https://i.pravatar.cc/80?u=${p.id}`}
                  alt={p.user.name}
                  className="w-9 h-9 rounded-lg object-cover shrink-0 grayscale"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm truncate">{p.user.name}</span>
                    <Badge color={p.isVerified ? 'green' : 'gray'} label={p.isVerified ? 'Active' : 'Unverified'} />
                  </div>
                  <p className="text-[11px] text-ink-dim truncate">{p.categories.map((c: any) => c.name).join(', ')}</p>
                </div>
              </div>

              {/* Stats + Tier row */}
              <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-border-dim">
                <div className="flex items-center gap-4 text-xs text-ink-dim">
                  <span><span className="font-semibold text-ink tabular-nums">{p._count.bookings}</span> jobs</span>
                  <span><span className="font-semibold text-ink tabular-nums">{p._count.reviews}</span> reviews</span>
                </div>
                <Badge color={TIER_COLORS[p.verificationTier] ?? 'gray'} label={TIER_LABELS[p.verificationTier] ?? p.verificationTier} />
              </div>

              {/* Actions row */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  defaultValue={p.verificationTier}
                  onChange={(e) => update(p.id, p.isVerified, e.target.value)}
                  className="text-xs border border-border-dim rounded-lg px-2.5 py-1.5 font-medium bg-surface-alt focus:ring-2 focus:ring-brand outline-none"
                >
                  <option value="TIER0_BASIC">Tier 0 – Basic</option>
                  <option value="TIER1_ID_VERIFIED">Tier 1 – ID</option>
                  <option value="TIER2_TRADE_VERIFIED">Tier 2 – Trade</option>
                  <option value="TIER3_ENHANCED">Tier 3 – Enhanced</option>
                </select>
                <div className="flex-1" />
                {!p.isVerified ? (
                  <button onClick={() => update(p.id, true, p.verificationTier)} className="flex items-center gap-1 px-2.5 py-1.5 bg-trust-surface text-trust border border-trust-edge rounded-lg text-xs font-semibold hover:bg-trust-surface/80 transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                ) : (
                  <button onClick={() => update(p.id, false, 'TIER0_BASIC')} className="flex items-center gap-1 px-2.5 py-1.5 bg-caution-surface text-caution border border-caution-edge rounded-lg text-xs font-semibold hover:bg-caution-surface/80 transition-colors">
                    <AlertTriangle className="w-3.5 h-3.5" /> Suspend
                  </button>
                )}
                <button onClick={() => update(p.id, false, p.verificationTier)} className="flex items-center gap-1 px-2.5 py-1.5 bg-danger-surface text-danger border border-danger-edge rounded-lg text-xs font-semibold hover:bg-danger-surface/80 transition-colors">
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Module 3: Booking Operations Console ────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'blue', IN_PROGRESS: 'orange', COMPLETED: 'green', CANCELED: 'red',
};

function BookingsModule() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetch('/api/admin?section=bookings')
      .then(r => r.json())
      .then(d => { setBookings(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <ModuleLoader />;

  const filtered = filter === 'ALL' ? bookings : bookings.filter(b => b.status === filter);

  return (
    <div>
      <ModuleHeader title="Booking Operations Console" description="Every request, quote, booking, status event, and owner of each case." />
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {['ALL', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'].map(s => (
          <FilterChip
            key={s}
            label={s === 'ALL' ? 'All' : s.replace('_', ' ')}
            active={filter === s}
            count={s === 'ALL' ? bookings.length : bookings.filter(b => b.status === s).length}
            onClick={() => setFilter(s)}
          />
        ))}
      </div>
      {filtered.length === 0 ? <AdminEmpty icon={Briefcase} title="No bookings match this filter" description="Try a different status filter or check back later." /> : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-border-dim p-5">
              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-sm">{b.quote?.request?.category?.name ?? 'Service'}</span>
                    <Badge color={STATUS_COLORS[b.status] ?? 'gray'} label={b.status.replace('_', ' ')} />
                    {b.quote?.request?.isUrgent && <Badge color="orange" label="Urgent" />}
                  </div>
                  <p className="text-xs text-ink-dim">
                    Customer: <span className="font-semibold text-ink-sub">{b.customer?.user?.name}</span>
                    &nbsp;→&nbsp;Provider: <span className="font-semibold text-ink-sub">{b.provider?.user?.name}</span>
                  </p>
                  {b.scheduledAt && (
                    <p className="text-xs text-ink-dim mt-0.5">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(b.scheduledAt).toLocaleDateString()} at {new Date(b.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="font-bold">€{b.totalAmount?.toFixed(2)}</div>
                    {b.payment && <div className="text-xs text-ink-dim">{b.payment.status}</div>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Module 4: Refund & Dispute Center ───────────────────────────────────────

function DisputesModule() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/admin?section=bookings')
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d) ? d : [];
        setBookings(list.filter((b: any) => b.status === 'CANCELED' || b.payment?.status === 'PENDING' || b.payment?.status === 'REFUNDED'));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const refund = async (bookingId: string) => {
    await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'refund', bookingId }),
    });
    load();
  };

  if (loading) return <ModuleLoader />;

  return (
    <div>
      <ModuleHeader title="Refund & Dispute Center" description="Approve refunds, review evidence, and enforce policy consistently." />
      {bookings.length === 0 ? <AdminEmpty icon={DollarSign} title="No open disputes or refunds" description="Cancelled bookings and refund requests will surface here." /> : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-border-dim p-5 flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-bold text-sm">{b.quote?.request?.category?.name ?? 'Service'}</span>
                  <Badge color={STATUS_COLORS[b.status] ?? 'gray'} label={b.status} />
                  {b.payment && <Badge color={b.payment.status === 'REFUNDED' ? 'green' : 'orange'} label={`Payment: ${b.payment.status}`} />}
                </div>
                <p className="text-xs text-ink-dim">
                  {b.customer?.user?.name} → {b.provider?.user?.name}
                </p>
                <p className="text-xs text-ink-dim mt-0.5">Booked: {new Date(b.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-bold">€{b.totalAmount?.toFixed(2)}</span>
                {b.status !== 'CANCELED' && b.payment?.status !== 'REFUNDED' && (
                  <button onClick={() => refund(b.id)} className="flex items-center gap-1 px-3 py-2 bg-danger-surface text-danger rounded-xl text-xs font-bold hover:bg-red-200 transition-colors">
                    <DollarSign className="w-3.5 h-3.5" /> Issue Refund
                  </button>
                )}
                {b.payment?.status === 'REFUNDED' && <Badge color="green" label="Refunded" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Module 5: Review Moderation ─────────────────────────────────────────────

function ReviewsModule() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/admin?section=reviews')
      .then(r => r.json())
      .then(d => { setReviews(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (reviewId: string, isHidden: boolean) => {
    await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: isHidden ? 'unblock_review' : 'block_review', reviewId }),
    });
    load();
  };

  if (loading) return <ModuleLoader />;

  return (
    <div>
      <ModuleHeader title="Review Moderation" description="Block fraudulent reviews, handle disputes, and preserve review integrity." />
      {reviews.length === 0 ? <AdminEmpty icon={Star} title="No reviews to moderate" description="Reviews will appear here as customers leave feedback." /> : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className={`bg-white rounded-2xl border p-5 transition-all ${r.isHidden ? 'border-red-100 opacity-60' : 'border-border-dim'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i <= r.rating ? 'text-brand fill-yellow-400' : 'text-ink-dim'}`} />
                      ))}
                    </div>
                    {r.isHidden && <Badge color="red" label="Blocked" />}
                  </div>
                  <p className="text-sm text-ink-sub mb-2 italic">&quot;{r.comment || '—'}&quot;</p>
                  <p className="text-xs text-ink-dim">
                    By <span className="font-semibold text-ink-sub">{r.customer?.user?.name}</span>
                    &nbsp;for&nbsp;<span className="font-semibold text-ink-sub">{r.provider?.user?.name}</span>
                    &nbsp;·&nbsp;{new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => toggle(r.id, r.isHidden)}
                  className={`shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    r.isHidden
                      ? 'bg-trust-surface text-trust hover:bg-green-200'
                      : 'bg-danger-surface text-danger hover:bg-red-200'
                  }`}
                >
                  {r.isHidden ? <><Eye className="w-3.5 h-3.5" /> Restore</> : <><EyeOff className="w-3.5 h-3.5" /> Block</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Module 6: Category & Pricing Config ─────────────────────────────────────

const PLATFORM_FEE = 12; // % — displayed as read-only config

function CategoriesModule() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin?section=categories')
      .then(r => r.json())
      .then(d => { setCategories(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <ModuleLoader />;

  return (
    <div>
      <ModuleHeader
        title="Category & Pricing Config"
        description="Service taxonomy, provider counts, and platform fee rules."
      />
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-border-dim p-5">
          <p className="text-xs font-bold text-ink-dim uppercase tracking-widest mb-1">Platform Take Rate</p>
          <p className="text-3xl font-bold">{PLATFORM_FEE}%</p>
          <p className="text-xs text-ink-dim mt-1">Applied to all completed bookings</p>
        </div>
        <div className="bg-white rounded-2xl border border-border-dim p-5">
          <p className="text-xs font-bold text-ink-dim uppercase tracking-widest mb-1">Active Categories</p>
          <p className="text-3xl font-bold">{categories.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-border-dim p-5">
          <p className="text-xs font-bold text-ink-dim uppercase tracking-widest mb-1">Booking Mode</p>
          <p className="text-3xl font-bold">Quote</p>
          <p className="text-xs text-ink-dim mt-1">Providers submit competitive quotes</p>
        </div>
      </div>
      <div className="space-y-3">
        {categories.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-border-dim p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-surface-alt rounded-xl flex items-center justify-center shrink-0">
                <Tag className="w-5 h-5 text-ink-dim" />
              </div>
              <div>
                <p className="font-bold">{c.name}</p>
                <p className="text-xs text-ink-dim">{c.description || 'No description'}</p>
              </div>
            </div>
            <div className="flex items-center gap-6 shrink-0 text-right">
              <div>
                <p className="text-xs text-ink-dim">Providers</p>
                <p className="font-bold">{c._count.providers}</p>
              </div>
              <div>
                <p className="text-xs text-ink-dim">Requests</p>
                <p className="font-bold">{c._count.requests}</p>
              </div>
              <div>
                <p className="text-xs text-ink-dim">Fee</p>
                <p className="font-bold">{PLATFORM_FEE}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Module 7: CRM / Referral Controls ───────────────────────────────────────

function CRMModule() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [creditUser, setCreditUser] = useState<any>(null);
  const [creditNote, setCreditNote] = useState('');

  useEffect(() => {
    fetch('/api/admin?section=users')
      .then(r => r.json())
      .then(d => { setUsers(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <ModuleLoader />;

  const filtered = roleFilter === 'ALL' ? users : users.filter(u => u.role === roleFilter);

  const ROLE_COLORS: Record<string, string> = { CUSTOMER: 'blue', PROVIDER: 'purple', ADMIN: 'orange' };

  return (
    <div>
      <ModuleHeader title="CRM / Referral Controls" description="Issue credits, manage invitations, and track user activity." />
      <div className="flex gap-2 mb-5 flex-wrap">
        {['ALL', 'CUSTOMER', 'PROVIDER', 'ADMIN'].map(r => (
          <FilterChip
            key={r}
            label={r === 'ALL' ? 'All' : r}
            active={roleFilter === r}
            count={r === 'ALL' ? users.length : users.filter(u => u.role === r).length}
            onClick={() => setRoleFilter(r)}
          />
        ))}
      </div>
      {creditUser && (
        <div className="mb-4 bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="flex-1">
            <p className="font-bold text-sm mb-1">Issue Credit / Note to {creditUser.name}</p>
            <input
              value={creditNote}
              onChange={e => setCreditNote(e.target.value)}
              placeholder="Note or credit description..."
              className="w-full text-sm p-3 bg-white border border-border rounded-xl outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => { setCreditUser(null); setCreditNote(''); }} className="px-3 py-2 border border-border rounded-xl text-xs font-bold text-ink-dim hover:border-border">Cancel</button>
            <button onClick={() => { setCreditUser(null); setCreditNote(''); }} className="px-3 py-2 bg-brand text-white rounded-xl text-xs font-bold hover:bg-gray-800">Confirm</button>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {filtered.map((u) => (
          <div key={u.id} className="bg-white rounded-2xl border border-border-dim p-4 flex items-center gap-4">
            <img src={u.image || `https://i.pravatar.cc/80?u=${u.id}`} alt={u.name} className="w-10 h-10 rounded-xl object-cover grayscale shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm">{u.name}</span>
                <Badge color={ROLE_COLORS[u.role] ?? 'gray'} label={u.role} />
              </div>
              <p className="text-xs text-ink-dim truncate">{u.email}</p>
              {u.providerProfile && (
                <p className="text-xs text-ink-dim">{u.providerProfile.completedJobs} jobs · {u.providerProfile.ratingAvg?.toFixed(1)} avg rating</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-ink-dim">Joined {new Date(u.createdAt).toLocaleDateString()}</span>
              <button onClick={() => setCreditUser(u)} className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-info rounded-xl text-xs font-bold hover:bg-info-surface transition-colors">
                <Plus className="w-3.5 h-3.5" /> Credit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Module 8: Incident Log ───────────────────────────────────────────────────

function IncidentModule() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/admin?section=tickets')
      .then(r => r.json())
      .then(d => { setTickets(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const createTicket = async () => {
    if (!form.subject.trim() || !form.description.trim()) return;
    setSubmitting(true);
    await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_ticket', ...form, reporterId: 'admin' }),
    });
    setForm({ subject: '', description: '' });
    setShowForm(false);
    setSubmitting(false);
    load();
  };

  const updateStatus = async (ticketId: string, status: string) => {
    await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_ticket', ticketId, status }),
    });
    load();
  };

  const TICKET_COLORS: Record<string, string> = { OPEN: 'orange', RESOLVED: 'green', CLOSED: 'gray' };

  if (loading) return <ModuleLoader />;

  return (
    <div>
      <ModuleHeader
        title="Incident Log"
        description="Record serious issues, safety concerns, repeat offenders, and escalations."
        action={
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all">
            <Plus className="w-4 h-4" /> New Incident
          </button>
        }
      />
      {showForm && (
        <div className="bg-white rounded-2xl border border-border-dim p-6 mb-6 shadow-sm">
          <h3 className="font-bold mb-4">Record New Incident</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-ink-dim uppercase tracking-widest mb-1 block">Subject</label>
              <input
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="e.g. Safety complaint – Marius K."
                className="w-full p-3 bg-surface-alt border border-border-dim rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-ink-dim uppercase tracking-widest mb-1 block">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Describe the incident, evidence, and recommended action..."
                className="w-full p-3 bg-surface-alt border border-border-dim rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-xl text-sm font-bold text-ink-dim hover:border-border">Cancel</button>
              <button onClick={createTicket} disabled={submitting} className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
      {tickets.length === 0 ? <AdminEmpty icon={FileWarning} title="No incidents recorded" description="Safety concerns and escalations will be tracked here." /> : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-border-dim p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold">{t.subject}</span>
                    <Badge color={TICKET_COLORS[t.status] ?? 'gray'} label={t.status} />
                  </div>
                  <p className="text-sm text-ink-dim mb-2">{t.description}</p>
                  <p className="text-xs text-ink-dim">{new Date(t.createdAt).toLocaleDateString()} at {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {t.status === 'OPEN' && (
                    <button onClick={() => updateStatus(t.id, 'RESOLVED')} className="px-3 py-1.5 bg-trust-surface text-trust rounded-xl text-xs font-bold hover:bg-green-200 transition-colors">Resolve</button>
                  )}
                  {t.status !== 'CLOSED' && (
                    <button onClick={() => updateStatus(t.id, 'CLOSED')} className="px-3 py-1.5 bg-surface-alt text-ink-dim rounded-xl text-xs font-bold hover:bg-border transition-colors">Close</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar Navigation ───────────────────────────────────────────────────────

const MODULES = [
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'providers', label: 'Provider Queue', icon: ShieldCheck },
  { id: 'bookings', label: 'Booking Console', icon: Briefcase },
  { id: 'disputes', label: 'Refund & Disputes', icon: DollarSign },
  { id: 'reviews', label: 'Review Moderation', icon: Star },
  { id: 'categories', label: 'Category Config', icon: Settings },
  { id: 'crm', label: 'CRM / Referrals', icon: Users },
  { id: 'incidents', label: 'Incident Log', icon: FileWarning },
];

// ─── Main Admin Shell ─────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [active, setActive] = useState('analytics');
  const [forbidden, setForbidden] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    fetch('/api/admin?section=overview').then(r => {
      if (r.status === 403) setForbidden(true);
    });
  }, []);

  if (forbidden) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-alt gap-4">
        <p className="text-2xl font-bold">Access Denied</p>
        <p className="text-ink-dim">Admin privileges required.</p>
        <a href="/login" className="bg-brand text-white px-6 py-3 rounded-2xl font-bold hover:bg-gray-800">Log in</a>
      </div>
    );
  }

  const activeModule = MODULES.find(m => m.id === active) ?? MODULES[0];

  const renderModule = () => {
    switch (active) {
      case 'analytics':  return <AnalyticsModule />;
      case 'providers':  return <ProvidersModule />;
      case 'bookings':   return <BookingsModule />;
      case 'disputes':   return <DisputesModule />;
      case 'reviews':    return <ReviewsModule />;
      case 'categories': return <CategoriesModule />;
      case 'crm':        return <CRMModule />;
      case 'incidents':  return <IncidentModule />;
      default:           return <AnalyticsModule />;
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 bg-canvas border-r border-border-dim/50 flex-col sticky top-0 h-screen">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center shadow-sm">
              <AladdinIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-ink">Aladdin</span>
          </div>
          <span className="text-[10px] font-bold text-ink-dim uppercase tracking-widest ml-11">Admin Panel</span>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {MODULES.map((m) => (
            <button
              key={m.id}
              onClick={() => setActive(m.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left border ${
                active === m.id
                  ? 'bg-white shadow-sm border-border-dim text-brand'
                  : 'border-transparent text-ink-sub hover:text-ink hover:bg-white/60'
              }`}
            >
              <m.icon className="w-4 h-4 shrink-0" />
              {m.label}
            </button>
          ))}
        </nav>

        <div className="p-6">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ink-dim hover:text-danger hover:bg-danger-surface transition-all"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Mobile Slide-out Menu Overlay */}
      {showMobileMenu && (
        <div
          className="md:hidden fixed inset-0 bg-ink/40 backdrop-blur-sm z-40"
          onClick={() => setShowMobileMenu(false)}
        />
      )}

      {/* Mobile Slide-out Menu Panel */}
      <aside className={`md:hidden fixed top-0 left-0 h-full w-72 bg-canvas z-50 flex flex-col shadow-float transition-transform duration-300 ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between border-b border-border-dim">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center shadow-sm">
              <AladdinIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-semibold text-base tracking-tight text-ink block">Aladdin</span>
              <span className="text-[10px] font-bold text-ink-dim uppercase tracking-widest">Admin Panel</span>
            </div>
          </div>
          <button
            onClick={() => setShowMobileMenu(false)}
            className="p-2 rounded-xl hover:bg-surface-alt transition-colors text-ink-dim"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {MODULES.map((m) => (
            <button
              key={m.id}
              onClick={() => { setActive(m.id); setShowMobileMenu(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all text-left border ${
                active === m.id
                  ? 'bg-white shadow-sm border-border-dim text-brand'
                  : 'border-transparent text-ink-sub hover:text-ink hover:bg-white/60'
              }`}
            >
              <m.icon className="w-4 h-4 shrink-0" />
              {m.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border-dim">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-ink-dim hover:text-danger hover:bg-danger-surface transition-all"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile Top Bar */}
        <header className="md:hidden sticky top-0 z-30 bg-canvas/90 backdrop-blur-xl border-b border-border-dim/50 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setShowMobileMenu(true)}
            className="p-2 rounded-xl hover:bg-surface-alt transition-colors text-ink-sub"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <activeModule.icon className="w-4 h-4 text-brand shrink-0" />
            <span className="font-semibold text-sm text-ink truncate">{activeModule.label}</span>
          </div>
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center shadow-sm shrink-0">
            <AladdinIcon className="w-4 h-4 text-white" />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-10">
            {renderModule()}
          </div>
        </main>
      </div>
    </div>
  );
}
