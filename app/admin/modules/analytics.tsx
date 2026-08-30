'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle, AlertTriangle, Activity, DollarSign, MessageSquare,
  Package, ShieldCheck, TrendingUp, XCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Button, Card, PageHeader, SkeletonStat, Skeleton, StatCard,
} from '@/components/ui';

/* ─── Chart palette ─────────────────────────────────────────────────────────
 * Validated with the dataviz palette validator against the white card surface:
 *   lightness band PASS · CVD separation ΔE 13.8 (protan) / 24.9 (tritan) PASS
 *   normal-vision ΔE 22.3 PASS · contrast vs surface ≥ 3:1 PASS
 * The brief's original second series (--color-border #e8e6e1) failed contrast
 * at 1.25:1 — a near-invisible bar on white — so it was re-stepped to a warm
 * bronze in the same family as --color-cat-electrical.
 *
 * Recharts writes these straight onto SVG attributes, so token references have
 * to be literal `var()` strings rather than utility classes.
 * ────────────────────────────────────────────────────────────────────────── */
const SERIES_REQUESTS = 'var(--color-brand)';      /* token --color-brand      #1e6b58 */
const SERIES_BOOKINGS = '#b5854f';                 /* warm bronze — chart-only accent; no token
                                                      exists yet and globals.css is out of scope
                                                      for this wave (nearest kin:
                                                      --color-cat-electrical-ink #7a5410) */
const CHART_GRID = 'var(--color-border-dim)';      /* token --color-border-dim #f0ede8 */
const CHART_TICK = 'var(--color-ink-dim)';         /* token --color-ink-dim    #9ca3af */

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border-dim rounded-input shadow-elevated px-3 py-2 min-w-32">
      <p className="text-2xs font-bold uppercase tracking-widest text-ink-dim mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <span
            className="w-2 h-2 rounded-chip shrink-0"
            style={{ backgroundColor: p.fill }}
            aria-hidden="true"
          />
          <span className="text-ink-sub capitalize">{p.dataKey}</span>
          <span className="ml-auto pl-4 font-bold tabular-nums text-ink">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="w-2.5 h-2.5 rounded-chip shrink-0"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span className="text-3xs font-semibold text-ink-dim uppercase tracking-wide">{label}</span>
    </span>
  );
}

export function AnalyticsModule() {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setApiError(null);
    fetch('/api/admin?section=overview')
      .then(async r => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          setApiError(body.error ?? `Server error ${r.status}`);
          setLoading(false);
          return;
        }
        const d = await r.json();
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        setApiError(err.message ?? 'Network error — could not reach the server');
        setLoading(false);
      });
  }, []);

  useEffect(() => { load(); }, [load]);

  const seedDatabase = async () => {
    setSeeding(true);
    setSeedMsg(null);
    try {
      const r = await fetch('/api/admin/seed', { method: 'POST' });
      const d = await r.json();
      setSeedMsg(d.message ?? 'Done');
      load();
    } catch {
      setSeedMsg('Seed failed — check server logs.');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Command Center" description="Marketplace overview and operational health." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)}
        </div>
        <Skeleton rounded="card" className="h-64 w-full" />
      </div>
    );
  }

  if (apiError) {
    return (
      <div>
        <PageHeader title="Command Center" description="Marketplace overview and operational health." />
        <Card padding="lg" className="border-danger-edge bg-danger-surface text-center">
          <AlertCircle className="w-8 h-8 text-danger mx-auto mb-3" />
          <p className="font-bold text-sm text-danger mb-1">API Error</p>
          <p className="text-xs text-ink-sub mb-4 font-mono break-words">{apiError}</p>
          <Button variant="danger" size="sm" onClick={load}>Retry</Button>
        </Card>
      </div>
    );
  }

  const s = data?.stats ?? {};
  const pendingCount     = (data?.pendingVerifications ?? []).length;
  const canceledCount    = s.canceledBookings ?? 0;
  const cancellationRate = s.cancellationRate ?? 0;
  const isEmpty =
    (s.totalUsers ?? 0) === 0 && (s.totalProviders ?? 0) === 0 && (s.totalRequests ?? 0) === 0;

  // Action items derived from real data
  const actions = [
    pendingCount > 0 && { label: `${pendingCount} provider${pendingCount > 1 ? 's' : ''} awaiting approval`, tone: 'text-caution', bg: 'bg-caution-surface', icon: ShieldCheck },
    canceledCount > 0 && { label: `${canceledCount} cancelled booking${canceledCount > 1 ? 's' : ''} to review`, tone: 'text-danger', bg: 'bg-danger-surface', icon: AlertTriangle },
    cancellationRate > 15 && { label: `Cancellation rate at ${cancellationRate}% — above threshold`, tone: 'text-danger', bg: 'bg-danger-surface', icon: XCircle },
    (s.quoteRate ?? 0) < 30 && (s.totalRequests ?? 0) > 0 && { label: `Quote rate low at ${s.quoteRate}% — supply may be thin`, tone: 'text-caution', bg: 'bg-caution-surface', icon: MessageSquare },
  ].filter(Boolean) as { label: string; tone: string; bg: string; icon: React.ElementType }[];

  const primaryKpis = [
    { label: 'Requests',   value: s.totalRequests ?? 0,            icon: Package,       iconClassName: 'bg-info-surface text-info' },
    { label: 'GMV',        value: `€${(s.gmv ?? 0).toFixed(0)}`,   icon: DollarSign,    iconClassName: 'bg-trust-surface text-trust' },
    { label: 'Conversion', value: `${s.conversionRate ?? 0}%`,     icon: TrendingUp,    iconClassName: 'bg-brand-muted text-brand' },
    { label: 'Quote Rate', value: `${s.quoteRate ?? 0}%`,          icon: MessageSquare, iconClassName: 'bg-caution-surface text-caution' },
  ];

  const secondaryKpis = [
    { label: 'Cancellation', value: `${s.cancellationRate ?? 0}%` },
    { label: 'Providers',    value: s.totalProviders ?? 0 },
    { label: 'Users',        value: s.totalUsers ?? 0 },
    { label: 'Reviews',      value: s.totalReviews ?? 0 },
  ];

  const completionRate = (s.totalBookings ?? 0) > 0
    ? Math.round(((s.completedBookings ?? 0) / s.totalBookings) * 100)
    : 0;
  const supplyRatio = (s.totalRequests ?? 0) > 0
    ? ((s.totalProviders ?? 0) / s.totalRequests).toFixed(1)
    : '—';

  const health = [
    { label: 'Demand',     value: `${s.totalRequests ?? 0} requests`,  sub: `${s.totalBookings ?? 0} converted to bookings` },
    { label: 'Supply',     value: `${s.totalProviders ?? 0} providers`, sub: `${supplyRatio} providers per request` },
    { label: 'Fulfilment', value: `${completionRate}% completed`,       sub: `${canceledCount} cancelled` },
    { label: 'Trust',      value: `${s.totalReviews ?? 0} reviews`,     sub: `${pendingCount} pending verification${pendingCount !== 1 ? 's' : ''}` },
  ];

  return (
    <div>
      <PageHeader title="Command Center" description="Marketplace overview and operational health." />

      {/* ── Empty DB banner ── */}
      {isEmpty && (
        <Card padding="md" className="mb-5 bg-caution-surface border-caution-edge">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-caution shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-caution mb-1">Database is empty</p>
              <p className="text-xs text-ink-sub mb-3">
                No users, providers, or requests found. Seed the database with demo data to populate the dashboard.
              </p>
              {seedMsg && <p className="text-xs font-semibold text-trust mb-2">{seedMsg}</p>}
              <Button size="sm" onClick={seedDatabase} loading={seeding} disabled={seeding}>
                {!seeding && <Activity className="w-3.5 h-3.5" />}
                {seeding ? 'Seeding…' : 'Seed Demo Data'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ── Action needed ── */}
      {actions.length > 0 && (
        <div className="mb-5">
          <p className="text-2xs font-bold text-ink-dim uppercase tracking-widest mb-2">Action needed</p>
          <div className="space-y-1.5">
            {actions.map((a, i) => (
              <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-input ${a.bg}`}>
                <a.icon className={`w-3.5 h-3.5 shrink-0 ${a.tone}`} />
                <span className={`text-xs font-semibold ${a.tone}`}>{a.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Primary KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        {primaryKpis.map(k => (
          <StatCard
            key={k.label}
            label={k.label}
            value={k.value}
            icon={k.icon}
            iconClassName={k.iconClassName}
          />
        ))}
      </div>

      {/* ── Secondary KPIs ── */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {secondaryKpis.map(k => (
          <div key={k.label} className="bg-card rounded-card border border-border-dim shadow-card px-3 py-3 text-center">
            <div className="text-lg font-bold tabular-nums text-ink">{k.value}</div>
            <div className="text-3xs font-semibold text-ink-dim uppercase tracking-wide mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── Weekly activity ── */}
      <Card padding="md" className="mb-5 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-bold text-sm text-ink">Weekly Activity</h2>
          <div className="flex gap-4">
            <LegendSwatch color={SERIES_REQUESTS} label="Requests" />
            <LegendSwatch color={SERIES_BOOKINGS} label="Bookings" />
          </div>
        </div>
        <div className="h-44 sm:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.weeklyActivity ?? []} barGap={2} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: CHART_TICK }} />
              <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 11, fill: CHART_TICK }} width={28} />
              <Tooltip cursor={{ fill: CHART_GRID }} content={<ChartTooltip />} />
              <Bar dataKey="requests" name="Requests" fill={SERIES_REQUESTS} radius={[4, 4, 0, 0]} />
              <Bar dataKey="bookings" name="Bookings" fill={SERIES_BOOKINGS} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ── Marketplace health ── */}
      <Card padding="md" className="sm:p-5">
        <h2 className="font-bold text-sm text-ink mb-3">Marketplace Health</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {health.map(h => (
            <div key={h.label} className="px-3 py-2.5 rounded-input bg-surface-alt">
              <p className="text-3xs font-semibold text-ink-dim uppercase tracking-wide">{h.label}</p>
              <p className="text-sm font-bold text-ink mt-0.5">{h.value}</p>
              <p className="text-2xs text-ink-dim">{h.sub}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
