'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  DollarSign, Clock, CheckCircle2, Download,
  TrendingUp, ChevronRight, Landmark,
  Briefcase, Receipt,
} from 'lucide-react';
import Link from 'next/link';
import { PLATFORM_FEE_RATE } from '@/lib/fees';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import {
  Card, EmptyState, PageHeader, SectionHeader, Skeleton, SkeletonStat, StatCard,
  StatusBadge, buttonVariants, statusVariant, useToast,
} from '@/components/ui';

// The real platform fee charged by the payment code (Stripe application_fee).
// This page previously hardcoded a fabricated 12%.
const PLATFORM_FEE = PLATFORM_FEE_RATE;

export default function EarningsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslation();
  const { toast } = useToast();
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
      toast.error(data.error ?? t.earningsPage.setupFailed);
    } finally {
      setConnectingStripe(false);
    }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto">
      <Skeleton rounded="chip" className="h-8 w-56 mb-6 sm:mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4 mb-4 sm:mb-8">
        <Skeleton rounded="card" className="col-span-2 sm:col-span-1 h-28" />
        <SkeletonStat />
        <SkeletonStat />
      </div>
      <Skeleton rounded="card" className="h-40" />
    </div>
  );

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

  const invoiceNumber = (b: any) => `AL-${b.id.slice(0, 8).toUpperCase()}`;
  const invoiceDate = (b: any) =>
    new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  // Payment state shown on an invoice: a completed job whose payment row hasn't
  // settled yet is still "processing", everything else falls back to pending.
  const invoicePaymentStatus = (b: any): keyof typeof t.statuses.payment =>
    b.payment?.status === 'PAID' ? 'PAID'
    : b.payment?.status === 'REFUNDED' ? 'REFUNDED'
    : (b.payment?.status === 'PROCESSING' || b.status === 'COMPLETED') ? 'PROCESSING'
    : 'PENDING';

  const downloadInvoice = (b: any) => {
    const rows = [
      ['Invoice', invoiceNumber(b)],
      ['Date', invoiceDate(b)],
      ['Service', b.quote?.request?.category?.name ?? 'Service'],
      ['Customer', b.customer?.user?.name ?? ''],
      ['Total', `€${Number(b.totalAmount).toFixed(2)}`],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${invoiceNumber(b)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

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
    <div className="max-w-3xl mx-auto">
      {/* Mobile-only section tabs */}
      <div className="md:hidden flex gap-1 p-1 bg-surface-alt rounded-card border border-border-dim mb-4">
        <Link href="/provider/performance" className="flex-1 py-2 rounded-input text-sm font-medium text-center transition-all text-ink-sub hover:text-ink">
          {t.providerNav.performance}
        </Link>
        <div className="flex-1 py-2 rounded-input text-sm font-semibold text-center transition-all bg-card text-brand shadow-card">
          {t.providerNav.earnings}
        </div>
      </div>

      <PageHeader
        title={t.earningsPage.title}
        className="mb-4 sm:mb-8"
        action={
          <button onClick={exportTaxCSV} className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
            <Download className="w-4 h-4" /> {t.earningsPage.taxExport}
          </button>
        }
      />

      {/* ── Money summary — one tree: brand hero + two stat tiles ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4 mb-4 sm:mb-8">
        <div className="col-span-2 sm:col-span-1 bg-brand text-white rounded-card p-4 sm:p-6 shadow-elevated">
          <div className="flex items-center justify-between gap-2 mb-1 sm:mb-2">
            <p className="text-3xs text-white/60 font-bold uppercase tracking-widest">{t.earningsPage.netEarned}</p>
            <div className="flex items-center gap-1 text-white/60">
              <Briefcase className="w-3 h-3" />
              <span className="text-3xs font-bold">{completed.length} {t.earningsPage.jobsSuffix}</span>
            </div>
          </div>
          <p className="text-3xl font-semibold tracking-tight">€{totalNet.toFixed(2)}</p>
          {totalGross > 0 && (
            <p className="text-xs text-white/50 mt-1 sm:mt-2">
              €{totalGross.toFixed(2)} {t.earningsPage.grossSuffix} · {t.earningsPage.platformFeeShort}
              {processingNet > 0 && <> · €{processingNet.toFixed(2)} {t.earningsPage.stillProcessing}</>}
            </p>
          )}
        </div>

        <StatCard
          label={t.earningsPage.pendingLabel}
          value={`€${pendingAmount.toFixed(2)}`}
          sub={pending.length > 0
            ? `${pending.length} ${t.earningsPage.activeJobsSuffix}`
            : t.earningsPage.noPendingEarnings}
          icon={Clock}
          className="p-3.5 sm:p-5"
        />

        <StatCard
          label={t.earningsPage.settled}
          value={`€${settledNet.toFixed(2)}`}
          sub={processingNet > 0
            ? `€${processingNet.toFixed(2)} ${t.earningsPage.processingSuffix}`
            : `${t.earningsPage.feeLabel} · €${(totalGross * PLATFORM_FEE).toFixed(2)} ${t.earningsPage.totalSuffix}`}
          icon={CheckCircle2}
          iconClassName="bg-trust-surface text-trust"
          className="p-3.5 sm:p-5"
        />
      </div>

      {/* Earnings chart */}
      {months.length > 0 && (
        <Card
          padding="none"
          className={cn(
            'sm:rounded-panel mb-3.5 sm:mb-8',
            months.length <= 1 ? 'p-4 sm:p-6' : 'px-4 pt-3.5 pb-4 sm:p-6',
          )}
        >
          <div className="flex items-center justify-between mb-3 sm:mb-5">
            <p className="font-semibold text-ink text-sm sm:text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-ink-dim" /> {t.earningsPage.monthlyEarnings}
            </p>
            {months.length > 1 && (
              <p className="text-3xs text-ink-dim font-medium">{t.earningsPage.lastPrefix} {months.length} {t.earningsPage.monthsSuffix}</p>
            )}
          </div>

          {months.length === 1 ? (
            /* Single data point — compact inline display */
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-muted rounded-input flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-brand" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-ink">€{months[0][1].toFixed(2)}</p>
                <p className="text-xs text-ink-dim">{months[0][0]}</p>
              </div>
              <p className="text-3xs text-ink-dim">{t.earningsPage.firstMonth}</p>
            </div>
          ) : (
            /* Multi-month bar chart */
            <div className="flex items-end gap-1 h-24 sm:h-40">
              {months.map(([month, value]) => {
                const isMax = value === maxMonth;
                const pct = (value / maxMonth) * 100;
                return (
                  <div key={month} className="flex-1 flex flex-col items-center min-w-0">
                    <span className="text-3xs font-bold text-ink-dim mb-1 truncate">
                      €{value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0)}
                    </span>
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className={`w-full rounded-t-chip sm:rounded-t-input transition-all ${isMax ? 'bg-brand' : 'bg-brand/50'}`}
                        style={{ height: `${Math.max(pct, 6)}%` }}
                      />
                    </div>
                    <span className="text-3xs font-bold text-ink-dim uppercase mt-1.5 truncate">{month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Earnings sub-tabs — tighter to content */}
      <div className="flex gap-1 p-1 bg-surface-alt rounded-input sm:rounded-card mb-3.5 sm:mb-8 overflow-x-auto">
        {([
          { key: 'overview' as const, label: t.earningsPage.tabOverview },
          { key: 'history' as const, label: t.earningsPage.tabHistory },
          { key: 'payouts' as const, label: t.earningsPage.tabPayouts },
        ]).map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-chip sm:rounded-input text-xs transition-all capitalize ${
              tab === key ? 'bg-card text-brand shadow-card font-semibold' : 'text-ink-sub hover:text-ink font-medium'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <Card padding="sm" className="sm:p-5">
          <p className="font-semibold text-sm sm:text-base text-ink mb-3 sm:mb-4">{t.earningsPage.earningsBreakdown}</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-ink-sub">{t.earningsPage.grossRevenue}</span><span className="font-semibold">€{totalGross.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-ink-sub">{t.earningsPage.platformFee}</span><span className="text-ink-sub">−€{(totalGross * PLATFORM_FEE).toFixed(2)}</span></div>
            <div className="flex justify-between font-bold pt-2 border-t border-border-dim text-base sm:text-lg"><span>{t.earningsPage.netEarnings}</span><span className="text-brand">€{totalNet.toFixed(2)}</span></div>
          </div>
          <div className="mt-3 pt-3 border-t border-border-dim flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-ink-dim shrink-0" />
            <p className="text-xs text-ink-sub">{t.earningsPage.payoutNote}</p>
          </div>
        </Card>
      )}

      {/* History */}
      {tab === 'history' && (
        <div>
          {completed.length === 0 ? (
            <Card padding="md" className="border-dashed sm:p-10">
              <EmptyState
                icon={DollarSign}
                size="sm"
                title={t.earningsPage.noCompletedTitle}
                description={t.earningsPage.noCompletedDesc}
              />
            </Card>
          ) : (
            <Card padding="none" className="overflow-hidden divide-y divide-border-dim">
              {completed.map(b => (
                <Link key={b.id} href={`/provider/jobs/${b.id}`}
                  className="flex items-center gap-3 p-3.5 sm:p-4 hover:bg-surface-alt/50 transition-colors">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-trust-surface rounded-input flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-trust" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-ink truncate">{b.quote?.request?.category?.name ?? t.requestsList.serviceFallback}</p>
                    <p className="text-2xs text-ink-dim mt-0.5">
                      {new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {b.customer?.user?.name && <span> · {b.customer.user.name}</span>}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-trust text-sm">+€{(b.totalAmount * (1 - PLATFORM_FEE)).toFixed(2)}</p>
                    <p className={`text-3xs ${b.payment?.status === 'PAID' ? 'text-trust' : 'text-caution'}`}>
                      {b.payment?.status === 'PAID' ? t.earningsPage.paidOut : t.earningsPage.processing}
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-ink-dim/50 shrink-0" />
                </Link>
              ))}
            </Card>
          )}
        </div>
      )}

      {/* Payouts — real Stripe Connect state (the old tab described a SEPA/
          IBAN system that didn't exist and had an inert Add-bank button). */}
      {tab === 'payouts' && (
        <div className="space-y-3 sm:space-y-4">
          {stripeOnboarded ? (
            <Card padding="sm" className="sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-trust-surface rounded-input flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-trust" />
                </div>
                <div>
                  <p className="font-semibold text-sm sm:text-base text-ink">{t.earningsPage.payoutsActive}</p>
                  <p className="text-2xs sm:text-xs text-ink-dim">{t.earningsPage.connectedViaStripe}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-sm">
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
            </Card>
          ) : (
            <div className="bg-caution-surface border border-caution-edge rounded-card p-4 sm:p-5">
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
                    className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'bg-caution hover:bg-caution/90')}
                  >
                    {connectingStripe ? t.earningsPage.openingStripe : t.earningsPage.setUpPayouts}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Invoices — one document row per booking ── */}
          <Card padding="none" className="overflow-hidden">
            <div className="px-4 pt-4 sm:px-5 sm:pt-5">
              <SectionHeader title={t.earningsPage.invoicesTitle} className="mb-0" />
            </div>

            {bookings.length === 0 ? (
              <div className="px-4 sm:px-5">
                <EmptyState
                  icon={Receipt}
                  size="sm"
                  title={t.earningsPage.invoicesEmptyTitle}
                  description={t.earningsPage.invoicesEmptyDesc}
                />
              </div>
            ) : (
              <div className="mt-4 divide-y divide-border-dim border-t border-border-dim">
                {bookings.map(b => {
                  const payStatus = invoicePaymentStatus(b);
                  return (
                    <div key={b.id} className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-ink truncate">
                            {b.quote?.request?.category?.name ?? t.requestsList.serviceFallback}
                          </p>
                          <p className="text-2xs text-ink-dim mt-0.5">
                            {invoiceDate(b)} · <span className="font-mono">{invoiceNumber(b)}</span>
                            {b.customer?.user?.name && <span> · {b.customer.user.name}</span>}
                          </p>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1.5">
                          <p className="text-base font-bold text-ink leading-none">€{Number(b.totalAmount).toFixed(2)}</p>
                          <StatusBadge
                            variant={statusVariant('payment', payStatus)}
                            label={t.statuses.payment[payStatus]}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <Link
                          href={`/provider/jobs/${b.id}`}
                          className={buttonVariants({ variant: 'secondary', size: 'sm' })}
                        >
                          {t.quoteInbox.viewBooking}
                        </Link>
                        <button
                          onClick={() => downloadInvoice(b)}
                          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                        >
                          <Download className="w-3.5 h-3.5" /> {t.earningsPage.invoiceDownload}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
