'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Loader2, DollarSign, Clock, CheckCircle2, Download,
  TrendingUp, Calendar, ChevronRight, Landmark, FileText,
  Briefcase,
} from 'lucide-react';
import Link from 'next/link';
import { PLATFORM_FEE_RATE } from '@/lib/fees';
import { useTranslation } from '@/lib/i18n';

// The real platform fee charged by the payment code (Stripe application_fee).
// This page previously hardcoded a fabricated 12%.
const PLATFORM_FEE = PLATFORM_FEE_RATE;

export default function EarningsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslation();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'history' | 'payouts'>('overview');
  const [stripeOnboarded, setStripeOnboarded] = useState<boolean | null>(null);
  const [connectingStripe, setConnectingStripe] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') {
      fetch('/api/bookings')
        .then(r => r.json())
        .then(d => { setBookings(Array.isArray(d) ? d : []); setLoading(false); })
        .catch(() => setLoading(false));
      fetch('/api/provider/profile')
        .then(r => r.json())
        .then(p => setStripeOnboarded(Boolean(p?.stripeOnboarded)))
        .catch(() => {});
    }
  }, [status, router]);

  const setUpPayouts = async () => {
    setConnectingStripe(true);
    try {
      const res = await fetch('/api/provider/stripe-connect', { method: 'POST' });
      const data = await res.json().catch(() => ({} as any));
      if (data.url) { window.location.href = data.url; return; }
      alert(data.error ?? t.earningsPage.setupFailed);
    } finally {
      setConnectingStripe(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-ink-dim" /></div>;

  const completed = bookings.filter(b => b.status === 'COMPLETED');
  const pending = bookings.filter(b => b.status === 'SCHEDULED' || b.status === 'IN_PROGRESS');

  // Honest money states: 'settled' = the final payment actually went through
  // (PAID); everything else completed is still processing.
  const settled = completed.filter(b => b.payment?.status === 'PAID');
  const processing = completed.filter(b => b.payment?.status !== 'PAID');

  const totalGross = completed.reduce((s, b) => s + (b.totalAmount ?? 0), 0);
  const totalNet = totalGross * (1 - PLATFORM_FEE);
  const settledNet = settled.reduce((s, b) => s + (b.totalAmount ?? 0), 0) * (1 - PLATFORM_FEE);
  const processingNet = processing.reduce((s, b) => s + (b.totalAmount ?? 0), 0) * (1 - PLATFORM_FEE);
  const pendingAmount = pending.reduce((s, b) => s + (b.totalAmount ?? 0) * (1 - PLATFORM_FEE), 0);

  // Group by month for chart
  const byMonth: Record<string, number> = {};
  completed.forEach(b => {
    const month = new Date(b.scheduledAt).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
    byMonth[month] = (byMonth[month] ?? 0) + b.totalAmount * (1 - PLATFORM_FEE);
  });
  const months = Object.entries(byMonth).slice(-6);
  const maxMonth = Math.max(...months.map(([, v]) => v), 1);

  const exportTaxCSV = () => {
    const rows = [
      ['Date', 'Category', 'Customer', 'Gross (€)', 'Platform Fee (€)', 'Net Earnings (€)', 'Status'],
      ...completed.map(b => [
        new Date(b.scheduledAt).toLocaleDateString('en-GB'),
        b.quote?.request?.category?.name ?? 'Service',
        b.customer?.user?.name ?? '',
        b.totalAmount?.toFixed(2),
        (b.totalAmount * PLATFORM_FEE).toFixed(2),
        (b.totalAmount * (1 - PLATFORM_FEE)).toFixed(2),
        'PAID',
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aladdin-earnings-${new Date().getFullYear()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Mobile-only section tabs */}
      <div className="md:hidden flex gap-1 p-1 bg-surface-alt rounded-2xl shadow-sm mb-4">
        <Link href="/provider/performance" className="flex-1 py-2 rounded-xl text-sm font-medium text-center transition-all text-ink-sub hover:text-ink">
          {t.providerNav.performance}
        </Link>
        <div className="flex-1 py-2 rounded-xl text-sm font-semibold text-center transition-all bg-white text-brand shadow-card">
          {t.providerNav.earnings}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">{t.earningsPage.title}</h1>
        {/* Tax Export — desktop only in header */}
        <button onClick={exportTaxCSV} className="hidden sm:flex items-center gap-2 text-sm font-medium border border-border-dim px-5 py-2.5 rounded-full hover:border-brand/30 hover:shadow-sm transition-all bg-white">
          <Download className="w-4 h-4" /> {t.earningsPage.taxExport}
        </button>
      </div>

      {/* ── Mobile: Earnings hero composition ── */}
      <div className="sm:hidden mb-4">
        {/* Total earned — enriched hero */}
        <div className="bg-brand text-white rounded-2xl p-4 shadow-md mb-2.5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">{t.earningsPage.netEarned}</p>
            <div className="flex items-center gap-1 text-white/50">
              <Briefcase className="w-3 h-3" />
              <span className="text-[10px] font-bold">{completed.length} {t.earningsPage.jobsSuffix}</span>
            </div>
          </div>
          <p className="text-3xl font-semibold tracking-tight">€{totalNet.toFixed(2)}</p>
          {totalGross > 0 && (
            <p className="text-xs text-white/40 mt-1">
              €{totalGross.toFixed(2)} {t.earningsPage.grossSuffix} · {t.earningsPage.platformFeeShort}
              {processingNet > 0 && <> · €{processingNet.toFixed(2)} {t.earningsPage.stillProcessing}</>}
            </p>
          )}
        </div>
        {/* Pending — compact companion */}
        {pending.length > 0 ? (
          <div className="flex items-center justify-between bg-white border border-border-dim rounded-xl px-3.5 py-2.5 shadow-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-ink-dim" />
              <span className="text-xs font-medium text-ink-sub">{t.earningsPage.pendingLabel}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-ink">€{pendingAmount.toFixed(2)}</span>
              <span className="text-[10px] text-ink-dim">{pending.length} {pending.length !== 1 ? t.earningsPage.jobsPlural : t.earningsPage.jobSingular}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-surface-alt rounded-xl px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-ink-dim" />
              <span className="text-xs text-ink-dim">{t.earningsPage.noPendingEarnings}</span>
            </div>
            <span className="text-sm font-medium text-ink-dim">€0.00</span>
          </div>
        )}
      </div>

      {/* ── Desktop: Original summary cards grid ── */}
      <div className="hidden sm:grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-brand text-white rounded-2xl p-6 shadow-md">
          <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest mb-2">{t.earningsPage.totalEarned}</p>
          <p className="text-3xl font-semibold tracking-tight">€{totalNet.toFixed(2)}</p>
          <p className="text-sm text-white/60 mt-2">{completed.length} {t.earningsPage.jobsSuffix}</p>
        </div>
        <div className="bg-white border border-border-dim rounded-2xl p-6 shadow-sm">
          <p className="text-[10px] text-ink-dim font-bold uppercase tracking-widest mb-2">{t.earningsPage.pendingLabel}</p>
          <p className="text-3xl font-semibold tracking-tight text-ink">€{pendingAmount.toFixed(2)}</p>
          <p className="text-sm text-ink-sub mt-2">{pending.length} {t.earningsPage.activeJobsSuffix}</p>
        </div>
        <div className="bg-white border border-border-dim rounded-2xl p-6 shadow-sm">
          <p className="text-[10px] text-ink-dim font-bold uppercase tracking-widest mb-2">{t.earningsPage.settled}</p>
          <p className="text-3xl font-semibold tracking-tight text-ink">€{settledNet.toFixed(2)}</p>
          <p className="text-sm text-ink-sub mt-2">
            {processingNet > 0 ? `€${processingNet.toFixed(2)} ${t.earningsPage.processingSuffix}` : `${t.earningsPage.feeLabel} · €${(totalGross * PLATFORM_FEE).toFixed(2)} ${t.earningsPage.totalSuffix}`}
          </p>
        </div>
      </div>

      {/* Earnings chart */}
      {months.length > 0 && (
        <div className={`bg-white rounded-2xl sm:rounded-3xl border border-border-dim shadow-sm mb-3.5 sm:mb-8 ${
          months.length <= 1 ? 'p-4 sm:p-6' : 'px-4 pt-3.5 pb-4 sm:p-6'
        }`}>
          <div className="flex items-center justify-between mb-3 sm:mb-5">
            <p className="font-semibold text-ink text-sm sm:text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-ink-dim" /> {t.earningsPage.monthlyEarnings}
            </p>
            {months.length > 1 && (
              <p className="text-[10px] text-ink-dim font-medium">{t.earningsPage.lastPrefix} {months.length} {t.earningsPage.monthsSuffix}</p>
            )}
          </div>

          {months.length === 1 ? (
            /* Single data point — compact inline display */
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-muted rounded-xl flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-brand" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-ink">€{months[0][1].toFixed(2)}</p>
                <p className="text-xs text-ink-dim">{months[0][0]}</p>
              </div>
              <p className="text-[10px] text-ink-dim">{t.earningsPage.firstMonth}</p>
            </div>
          ) : (
            /* Multi-month bar chart */
            <div className="flex items-end gap-1 h-24 sm:h-40">
              {months.map(([month, value]) => {
                const isMax = value === maxMonth;
                const pct = (value / maxMonth) * 100;
                return (
                  <div key={month} className="flex-1 flex flex-col items-center min-w-0">
                    <span className="text-[8px] sm:text-[10px] font-bold text-ink-dim mb-1 truncate">
                      €{value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0)}
                    </span>
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className={`w-full rounded-t-md sm:rounded-t-lg transition-all ${isMax ? 'bg-brand' : 'bg-brand/50'}`}
                        style={{ height: `${Math.max(pct, 6)}%` }}
                      />
                    </div>
                    <span className="text-[8px] sm:text-[10px] font-bold text-ink-dim uppercase mt-1.5 truncate">{month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Earnings sub-tabs — tighter to content */}
      <div className="flex gap-1 p-1 bg-surface-alt rounded-xl sm:rounded-2xl mb-3.5 sm:mb-8 overflow-x-auto">
        {([
          { key: 'overview' as const, label: t.earningsPage.tabOverview },
          { key: 'history' as const, label: t.earningsPage.tabHistory },
          { key: 'payouts' as const, label: t.earningsPage.tabPayouts },
        ]).map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-lg sm:rounded-xl text-xs transition-all capitalize ${
              tab === key ? 'bg-white text-brand shadow-card font-semibold' : 'text-ink-sub hover:text-ink font-medium'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="bg-white rounded-2xl border border-border-dim p-4 sm:p-5 shadow-sm">
          <p className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">{t.earningsPage.earningsBreakdown}</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-ink-sub">{t.earningsPage.grossRevenue}</span><span className="font-semibold">€{totalGross.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-ink-sub">{t.earningsPage.platformFee}</span><span className="text-ink-sub">−€{(totalGross * PLATFORM_FEE).toFixed(2)}</span></div>
            <div className="flex justify-between font-bold pt-2 border-t border-border-dim text-base sm:text-lg"><span>{t.earningsPage.netEarnings}</span><span className="text-brand">€{totalNet.toFixed(2)}</span></div>
          </div>
          <div className="mt-3 pt-3 border-t border-border-dim flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-ink-dim shrink-0" />
            <p className="text-xs text-ink-sub">{t.earningsPage.payoutNote}</p>
          </div>
        </div>
      )}

      {/* History */}
      {tab === 'history' && (
        <div>
          {completed.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-border p-6 sm:p-10 text-center">
              <DollarSign className="w-7 h-7 text-ink-dim mx-auto mb-2" />
              <p className="font-semibold text-sm mb-1">{t.earningsPage.noCompletedTitle}</p>
              <p className="text-xs text-ink-dim">{t.earningsPage.noCompletedDesc}</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-border-dim shadow-sm overflow-hidden divide-y divide-border-dim">
              {completed.map((b, idx) => (
                <Link key={b.id} href={`/provider/jobs/${b.id}`}
                  className="flex items-center gap-3 p-3.5 sm:p-4 hover:bg-surface-alt/50 transition-colors">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-trust-surface rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-trust" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[13px] sm:text-sm text-ink truncate">{b.quote?.request?.category?.name ?? t.requestsList.serviceFallback}</p>
                    <p className="text-[11px] text-ink-dim mt-0.5">
                      {new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {b.customer?.user?.name && <span> · {b.customer.user.name}</span>}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-trust text-[13px] sm:text-sm">+€{(b.totalAmount * (1 - PLATFORM_FEE)).toFixed(2)}</p>
                    <p className={`text-[10px] ${b.payment?.status === 'PAID' ? 'text-trust' : 'text-caution'}`}>
                      {b.payment?.status === 'PAID' ? t.earningsPage.paidOut : t.earningsPage.processing}
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-ink-dim/50 shrink-0 hidden sm:block" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payouts — real Stripe Connect state (the old tab described a SEPA/
          IBAN system that didn't exist and had an inert Add-bank button). */}
      {tab === 'payouts' && (
        <div className="space-y-3 sm:space-y-4">
          {stripeOnboarded ? (
            <div className="bg-white rounded-2xl border border-border-dim p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-trust-surface rounded-xl flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-trust" />
                </div>
                <div>
                  <p className="font-semibold text-sm sm:text-base text-ink">{t.earningsPage.payoutsActive}</p>
                  <p className="text-[11px] sm:text-xs text-ink-dim">{t.earningsPage.connectedViaStripe}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-[13px] sm:text-sm">
                {[
                  [t.earningsPage.rowMethod, t.earningsPage.rowMethodValue],
                  [t.earningsPage.rowWhen, t.earningsPage.rowWhenValue],
                  [t.earningsPage.rowProcessing, t.earningsPage.rowProcessingValue],
                  [t.earningsPage.rowPlatformFee, '10%'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-0.5">
                    <span className="text-ink-sub">{label}</span>
                    <span className="font-medium text-ink">{value}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={setUpPayouts}
                disabled={connectingStripe}
                className="mt-3 text-xs font-bold text-brand hover:underline disabled:opacity-50"
              >
                {connectingStripe ? t.earningsPage.openingStripe : t.earningsPage.managePayouts}
              </button>
            </div>
          ) : (
            <div className="bg-caution-surface border border-caution-edge rounded-2xl p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <Landmark className="w-5 h-5 text-caution shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-caution text-sm sm:text-base">{t.earningsPage.setupTitle}</p>
                  <p className="text-xs sm:text-sm text-caution mt-0.5 mb-3 leading-relaxed">
                    {t.earningsPage.payoutSetupDesc}
                  </p>
                  <button
                    onClick={setUpPayouts}
                    disabled={connectingStripe || stripeOnboarded === null}
                    className="text-xs sm:text-sm font-bold bg-caution text-white px-4 py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {connectingStripe ? t.earningsPage.openingStripe : t.earningsPage.setUpPayouts}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tax export — mobile only */}
          <div className="sm:hidden bg-white rounded-2xl border border-border-dim shadow-sm p-4">
            <button onClick={exportTaxCSV} className="w-full flex items-center gap-3 group">
              <div className="w-9 h-9 bg-surface-alt rounded-xl flex items-center justify-center shrink-0 group-hover:bg-brand-muted transition-colors">
                <FileText className="w-4 h-4 text-ink-dim group-hover:text-brand transition-colors" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-ink">{t.earningsPage.taxExportMobile}</p>
                <p className="text-[11px] text-ink-dim">{t.earningsPage.taxExportDesc}</p>
              </div>
              <Download className="w-4 h-4 text-ink-dim shrink-0" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
