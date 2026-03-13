'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { signOut } from 'next-auth/react';
import {
  BarChart3, ShieldCheck, Briefcase, AlertTriangle, Star,
  Settings, Users, FileWarning, LogOut, CheckCircle2,
  XCircle, Loader2, TrendingUp, Eye, EyeOff, Plus,
  Clock, DollarSign, Package, Activity, RefreshCcw,
  ChevronRight, MessageSquare, ArrowUpRight, X, Tag,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ModuleLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
    </div>
  );
}

function ModuleHeader({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">{title}</h1>
        <p className="text-gray-500 text-sm">{description}</p>
      </div>
      {action}
    </div>
  );
}

function Badge({ color, label }: { color: string; label: string }) {
  const colors: Record<string, string> = {
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
    orange: 'bg-orange-100 text-orange-700',
    gray: 'bg-gray-100 text-gray-500',
    yellow: 'bg-yellow-100 text-yellow-700',
    purple: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${colors[color] || colors.gray}`}>
      {label}
    </span>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-gray-200" />
      </div>
      <p className="text-gray-400 font-medium">{message}</p>
    </div>
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

  const kpis = [
    { label: 'Total Requests', value: s.totalRequests ?? 0, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'GMV (€)', value: `€${(s.gmv ?? 0).toFixed(0)}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Conversion Rate', value: `${s.conversionRate ?? 0}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Quote Rate', value: `${s.quoteRate ?? 0}%`, icon: MessageSquare, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Cancellation Rate', value: `${s.cancellationRate ?? 0}%`, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Total Providers', value: s.totalProviders ?? 0, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Total Users', value: s.totalUsers ?? 0, icon: Activity, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Total Reviews', value: s.totalReviews ?? 0, icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  ];

  return (
    <div>
      <ModuleHeader title="Analytics Dashboard" description="Requests, quote rates, conversions, GMV, take rate, cancellation rate, and provider SLA." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className={`w-10 h-10 ${k.bg} ${k.color} rounded-xl flex items-center justify-center mb-3`}>
              <k.icon className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{k.label}</div>
            <div className="text-2xl font-bold">{k.value}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-3xl border border-gray-100 p-6">
        <h2 className="font-bold text-lg mb-6">Marketplace Activity (Last 7 Days)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="requests" fill="#000" radius={[6, 6, 0, 0]} />
              <Bar dataKey="bookings" fill="#e5e7eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-6 mt-4">
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-black rounded-full" /><span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Requests</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-200 rounded-full" /><span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Bookings</span></div>
        </div>
      </div>
    </div>
  );
}

// ─── Module 2: Provider Approval Queue ───────────────────────────────────────

function ProvidersModule() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      <ModuleHeader
        title="Provider Approval Queue"
        description="Review documents, approve, reject, suspend, or downgrade provider trust badges."
        action={<button onClick={load} className="p-2 rounded-xl hover:bg-gray-100 transition-colors"><RefreshCcw className="w-4 h-4 text-gray-400" /></button>}
      />
      {providers.length === 0 ? <EmptyState icon={ShieldCheck} message="No providers found." /> : (
        <div className="space-y-3">
          {providers.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <img
                  src={p.user.image || `https://i.pravatar.cc/80?u=${p.id}`}
                  alt={p.user.name}
                  className="w-10 h-10 rounded-xl object-cover shrink-0 grayscale"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold truncate">{p.user.name}</span>
                    <Badge color={p.isVerified ? 'green' : 'gray'} label={p.isVerified ? 'Active' : 'Unverified'} />
                    <Badge color={TIER_COLORS[p.verificationTier] ?? 'gray'} label={TIER_LABELS[p.verificationTier] ?? p.verificationTier} />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{p.categories.map((c: any) => c.name).join(', ')} · {p._count.bookings} bookings · {p._count.reviews} reviews</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <select
                  defaultValue={p.verificationTier}
                  onChange={(e) => update(p.id, p.isVerified, e.target.value)}
                  className="text-xs border border-gray-200 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-black outline-none"
                >
                  <option value="TIER0_BASIC">Tier 0 – Basic</option>
                  <option value="TIER1_ID_VERIFIED">Tier 1 – ID</option>
                  <option value="TIER2_TRADE_VERIFIED">Tier 2 – Trade</option>
                  <option value="TIER3_ENHANCED">Tier 3 – Enhanced</option>
                </select>
                {!p.isVerified ? (
                  <button onClick={() => update(p.id, true, p.verificationTier)} className="flex items-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-xl text-xs font-bold hover:bg-green-200 transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                ) : (
                  <button onClick={() => update(p.id, false, 'TIER0_BASIC')} className="flex items-center gap-1 px-3 py-2 bg-orange-100 text-orange-700 rounded-xl text-xs font-bold hover:bg-orange-200 transition-colors">
                    <AlertTriangle className="w-3.5 h-3.5" /> Suspend
                  </button>
                )}
                <button onClick={() => update(p.id, false, p.verificationTier)} className="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-xl text-xs font-bold hover:bg-red-200 transition-colors">
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
      <div className="flex gap-2 mb-6 flex-wrap">
        {['ALL', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${filter === s ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400'}`}
          >
            {s === 'ALL' ? `All (${bookings.length})` : `${s.replace('_', ' ')} (${bookings.filter(b => b.status === s).length})`}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? <EmptyState icon={Briefcase} message="No bookings match this filter." /> : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-sm">{b.quote?.request?.category?.name ?? 'Service'}</span>
                    <Badge color={STATUS_COLORS[b.status] ?? 'gray'} label={b.status.replace('_', ' ')} />
                    {b.quote?.request?.isUrgent && <Badge color="orange" label="Urgent" />}
                  </div>
                  <p className="text-xs text-gray-400">
                    Customer: <span className="font-semibold text-gray-700">{b.customer?.user?.name}</span>
                    &nbsp;→&nbsp;Provider: <span className="font-semibold text-gray-700">{b.provider?.user?.name}</span>
                  </p>
                  {b.scheduledAt && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(b.scheduledAt).toLocaleDateString()} at {new Date(b.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="font-bold">€{b.totalAmount?.toFixed(2)}</div>
                    {b.payment && <div className="text-xs text-gray-400">{b.payment.status}</div>}
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
      {bookings.length === 0 ? <EmptyState icon={DollarSign} message="No disputes or refund requests at this time." /> : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-bold text-sm">{b.quote?.request?.category?.name ?? 'Service'}</span>
                  <Badge color={STATUS_COLORS[b.status] ?? 'gray'} label={b.status} />
                  {b.payment && <Badge color={b.payment.status === 'REFUNDED' ? 'green' : 'orange'} label={`Payment: ${b.payment.status}`} />}
                </div>
                <p className="text-xs text-gray-400">
                  {b.customer?.user?.name} → {b.provider?.user?.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Booked: {new Date(b.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-bold">€{b.totalAmount?.toFixed(2)}</span>
                {b.status !== 'CANCELED' && b.payment?.status !== 'REFUNDED' && (
                  <button onClick={() => refund(b.id)} className="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-xl text-xs font-bold hover:bg-red-200 transition-colors">
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
      {reviews.length === 0 ? <EmptyState icon={Star} message="No reviews yet." /> : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className={`bg-white rounded-2xl border p-5 transition-all ${r.isHidden ? 'border-red-100 opacity-60' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                    {r.isHidden && <Badge color="red" label="Blocked" />}
                  </div>
                  <p className="text-sm text-gray-700 mb-2 italic">&quot;{r.comment || '—'}&quot;</p>
                  <p className="text-xs text-gray-400">
                    By <span className="font-semibold text-gray-600">{r.customer?.user?.name}</span>
                    &nbsp;for&nbsp;<span className="font-semibold text-gray-600">{r.provider?.user?.name}</span>
                    &nbsp;·&nbsp;{new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => toggle(r.id, r.isHidden)}
                  className={`shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    r.isHidden
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
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
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Platform Take Rate</p>
          <p className="text-3xl font-bold">{PLATFORM_FEE}%</p>
          <p className="text-xs text-gray-400 mt-1">Applied to all completed bookings</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Active Categories</p>
          <p className="text-3xl font-bold">{categories.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Booking Mode</p>
          <p className="text-3xl font-bold">Quote</p>
          <p className="text-xs text-gray-400 mt-1">Providers submit competitive quotes</p>
        </div>
      </div>
      <div className="space-y-3">
        {categories.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                <Tag className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="font-bold">{c.name}</p>
                <p className="text-xs text-gray-400">{c.description || 'No description'}</p>
              </div>
            </div>
            <div className="flex items-center gap-6 shrink-0 text-right">
              <div>
                <p className="text-xs text-gray-400">Providers</p>
                <p className="font-bold">{c._count.providers}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Requests</p>
                <p className="font-bold">{c._count.requests}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Fee</p>
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
      <div className="flex gap-2 mb-6 flex-wrap">
        {['ALL', 'CUSTOMER', 'PROVIDER', 'ADMIN'].map(r => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${roleFilter === r ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400'}`}
          >
            {r === 'ALL' ? `All (${users.length})` : `${r} (${users.filter(u => u.role === r).length})`}
          </button>
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
              className="w-full text-sm p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => { setCreditUser(null); setCreditNote(''); }} className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:border-gray-400">Cancel</button>
            <button onClick={() => { setCreditUser(null); setCreditNote(''); }} className="px-3 py-2 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-800">Confirm</button>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {filtered.map((u) => (
          <div key={u.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
            <img src={u.image || `https://i.pravatar.cc/80?u=${u.id}`} alt={u.name} className="w-10 h-10 rounded-xl object-cover grayscale shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm">{u.name}</span>
                <Badge color={ROLE_COLORS[u.role] ?? 'gray'} label={u.role} />
              </div>
              <p className="text-xs text-gray-400 truncate">{u.email}</p>
              {u.providerProfile && (
                <p className="text-xs text-gray-400">{u.providerProfile.completedJobs} jobs · {u.providerProfile.ratingAvg?.toFixed(1)} avg rating</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-400">Joined {new Date(u.createdAt).toLocaleDateString()}</span>
              <button onClick={() => setCreditUser(u)} className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors">
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
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all">
            <Plus className="w-4 h-4" /> New Incident
          </button>
        }
      />
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
          <h3 className="font-bold mb-4">Record New Incident</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Subject</label>
              <input
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="e.g. Safety complaint – Marius K."
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Describe the incident, evidence, and recommended action..."
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:border-gray-400">Cancel</button>
              <button onClick={createTicket} disabled={submitting} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
      {tickets.length === 0 ? <EmptyState icon={FileWarning} message="No incidents recorded." /> : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold">{t.subject}</span>
                    <Badge color={TICKET_COLORS[t.status] ?? 'gray'} label={t.status} />
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{t.description}</p>
                  <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString()} at {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {t.status === 'OPEN' && (
                    <button onClick={() => updateStatus(t.id, 'RESOLVED')} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-xl text-xs font-bold hover:bg-green-200 transition-colors">Resolve</button>
                  )}
                  {t.status !== 'CLOSED' && (
                    <button onClick={() => updateStatus(t.id, 'CLOSED')} className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors">Close</button>
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

  useEffect(() => {
    fetch('/api/admin?section=overview').then(r => {
      if (r.status === 403) setForbidden(true);
    });
  }, []);

  if (forbidden) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-2xl font-bold">Access Denied</p>
        <p className="text-gray-500">Admin privileges required.</p>
        <a href="/login" className="bg-black text-white px-6 py-3 rounded-2xl font-bold hover:bg-gray-800">Log in</a>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <span className="font-bold text-xl tracking-tight">VilniusPro</span>
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-10">Admin Panel</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {MODULES.map((m) => (
            <button
              key={m.id}
              onClick={() => setActive(m.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                active === m.id
                  ? 'bg-black text-white'
                  : 'text-gray-500 hover:text-black hover:bg-gray-50'
              }`}
            >
              <m.icon className="w-4 h-4 shrink-0" />
              {m.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-10">
          {renderModule()}
        </div>
      </main>
    </div>
  );
}
