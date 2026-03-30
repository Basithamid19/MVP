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

const PLATFORM_FEE = 0.12;

export default function EarningsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'history' | 'payouts'>('overview');

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') {
      fetch('/api/bookings')
        .then(r => r.json())
        .then(d => { setBookings(Array.isArray(d) ? d : []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-ink-dim" /></div>;

  const completed = bookings.filter(b => b.status === 'COMPLETED');
  const pending = bookings.filter(b => b.status === 'SCHEDULED' || b.status === 'IN_PROGRESS');

  const totalGross = completed.reduce((s, b) => s + (b.totalAmount ?? 0), 0);
  const totalNet = totalGross * (1 - PLATFORM_FEE);
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
    a.download = `vilniuspro-earnings-${new Date().getFullYear()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Mobile-only section tabs */}
      <div className="md:hidden flex gap-1 p-1 bg-surface-alt rounded-2xl shadow-sm mb-4">
        <Link href="/provider/performance" className="flex-1 py-2 rounded-xl text-sm font-medium text-center transition-all text-ink-sub hover:text-ink">
          Performance
        </Link>
        <div className="flex-1 py-2 rounded-xl text-sm font-semibold text-center transition-all bg-white text-brand shadow-card">
          Earnings
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">Earnings & Payouts</h1>
        {/* Tax Export — desktop only in header */}
        <button onClick={exportTaxCSV} className="hidden sm:flex items-center gap-2 text-sm font-medium border border-border-dim px-5 py-2.5 rounded-full hover:border-brand/30 hover:shadow-sm transition-all bg-white">
          <Download className="w-4 h-4" /> Tax Export
        </button>
      </div>

      {/* ── Mobile: Earnings hero composition ── */}
      <div className="sm:hidden mb-4">
        {/* Total earned — enriched hero */}
        <div className="bg-brand text-white rounded-2xl p-4 shadow-md mb-2.5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Net Earned</p>
            <div className="flex items-center gap-1 text-white/50">
              <Briefcase className="w-3 h-3" />
              <span className="text-[10px] font-bold">{completed.length} jobs</span>
            </div>
          </div>
          <p className="text-3xl font-semibold tracking-tight">€{totalNet.toFixed(2)}</p>
          {totalGross > 0 && (
            <p className="text-xs text-white/40 mt-1">€{totalGross.toFixed(2)} gross · 12% platform fee</p>
          )}
        </div>
        {/* Pending — compact companion */}
        {pending.length > 0 ? (
          <div className="flex items-center justify-between bg-white border border-border-dim rounded-xl px-3.5 py-2.5 shadow-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-ink-dim" />
              <span className="text-xs font-medium text-ink-sub">Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-ink">€{pendingAmount.toFixed(2)}</span>
              <span className="text-[10px] text-ink-dim">{pending.length} job{pending.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-surface-alt rounded-xl px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-ink-dim" />
              <span className="text-xs text-ink-dim">No pending earnings</span>
            </div>
            <span className="text-sm font-medium text-ink-dim">€0.00</span>
          </div>
        )}
      </div>

      {/* ── Desktop: Original summary cards grid ── */}
      <div className="hidden sm:grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-brand text-white rounded-2xl p-6 shadow-md">
          <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest mb-2">Total Earned</p>
          <p className="text-3xl font-semibold tracking-tight">€{totalNet.toFixed(2)}</p>
          <p className="text-sm text-white/60 mt-2">{completed.length} jobs</p>
        </div>
        <div className="bg-white border border-border-dim rounded-2xl p-6 shadow-sm">
          <p className="text-[10px] text-ink-dim font-bold uppercase tracking-widest mb-2">Pending</p>
          <p className="text-3xl font-semibold tracking-tight text-ink">€{pendingAmount.toFixed(2)}</p>
          <p className="text-sm text-ink-sub mt-2">{pending.length} active jobs</p>
        </div>
        <div className="bg-white border border-border-dim rounded-2xl p-6 shadow-sm">
          <p className="text-[10px] text-ink-dim font-bold uppercase tracking-widest mb-2">Platform fee</p>
          <p className="text-3xl font-semibold tracking-tight text-ink">12%</p>
          <p className="text-sm text-ink-sub mt-2">€{(totalGross * PLATFORM_FEE).toFixed(2)} total</p>
        </div>
      </div>

      {/* Earnings chart */}
      {months.length > 0 && (
        <div className={`bg-white rounded-2xl sm:rounded-3xl border border-border-dim shadow-sm mb-3.5 sm:mb-8 ${
          months.length <= 1 ? 'p-4 sm:p-6' : 'px-4 pt-3.5 pb-4 sm:p-6'
        }`}>
          <div className="flex items-center justify-between mb-3 sm:mb-5">
            <p className="font-semibold text-ink text-sm sm:text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-ink-dim" /> Monthly earnings
            </p>
            {months.length > 1 && (
              <p className="text-[10px] text-ink-dim font-medium">Last {months.length} months</p>
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
              <p className="text-[10px] text-ink-dim">First month</p>
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
        {(['overview', 'history', 'payouts'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg sm:rounded-xl text-xs transition-all capitalize ${
              tab === t ? 'bg-white text-brand shadow-card font-semibold' : 'text-ink-sub hover:text-ink font-medium'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="bg-white rounded-2xl border border-border-dim p-4 sm:p-5 shadow-sm">
          <p className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Earnings breakdown</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-ink-sub">Gross revenue</span><span className="font-semibold">€{totalGross.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-ink-sub">Platform fee (12%)</span><span className="text-ink-sub">−€{(totalGross * PLATFORM_FEE).toFixed(2)}</span></div>
            <div className="flex justify-between font-bold pt-2 border-t border-border-dim text-base sm:text-lg"><span>Net earnings</span><span className="text-brand">€{totalNet.toFixed(2)}</span></div>
          </div>
          <div className="mt-3 pt-3 border-t border-border-dim flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-ink-dim shrink-0" />
            <p className="text-xs text-ink-sub">Paid weekly every Monday · Min €20 · Bank transfer</p>
          </div>
        </div>
      )}

      {/* History */}
      {tab === 'history' && (
        <div>
          {completed.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-border p-6 sm:p-10 text-center">
              <DollarSign className="w-7 h-7 text-ink-dim mx-auto mb-2" />
              <p className="font-semibold text-sm mb-1">No completed jobs yet</p>
              <p className="text-xs text-ink-dim">Earnings from completed bookings will appear here.</p>
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
                    <p className="font-semibold text-[13px] sm:text-sm text-ink truncate">{b.quote?.request?.category?.name ?? 'Service'}</p>
                    <p className="text-[11px] text-ink-dim mt-0.5">
                      {new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {b.customer?.user?.name && <span> · {b.customer.user.name}</span>}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-trust text-[13px] sm:text-sm">+€{(b.totalAmount * (1 - PLATFORM_FEE)).toFixed(2)}</p>
                    <p className="text-[10px] text-ink-dim">net</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-ink-dim/50 shrink-0 hidden sm:block" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payouts */}
      {tab === 'payouts' && (
        <div className="space-y-3 sm:space-y-4">
          {/* Next payout */}
          <div className="bg-white rounded-2xl border border-border-dim p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2.5 sm:mb-3">
              <p className="font-semibold text-sm sm:text-base">Next payout</p>
              <span className="text-[10px] font-medium text-ink-dim bg-surface-alt px-2 py-0.5 rounded-full">Monday</span>
            </div>
            <p className="text-2xl sm:text-2xl font-bold text-ink mb-2.5">€{Math.max(totalNet, 0).toFixed(2)}</p>
            <div className="w-full bg-surface-alt rounded-full h-1.5">
              <div className="bg-brand h-1.5 rounded-full transition-all" style={{ width: `${Math.min((totalNet / 200) * 100, 100)}%` }} />
            </div>
            <p className="text-[10px] text-ink-dim mt-1.5">Min threshold: €20</p>
          </div>

          {/* Finance settings — grouped card */}
          <div className="bg-white rounded-2xl border border-border-dim shadow-sm overflow-hidden">
            {/* Payout schedule */}
            <div className="p-4 sm:p-5">
              <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2.5 sm:mb-3">Payout schedule</p>
              <div className="space-y-1.5 text-[13px] sm:text-sm">
                {[
                  ['Frequency', 'Weekly'],
                  ['Day', 'Every Monday'],
                  ['Method', 'Bank transfer (SEPA)'],
                  ['Minimum', '€20.00'],
                  ['Processing', '1–2 business days'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-0.5">
                    <span className="text-ink-sub">{label}</span>
                    <span className="font-medium text-ink">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bank account */}
            <div className="border-t border-border-dim p-4 sm:p-5">
              <button className="w-full flex items-center gap-3 group">
                <div className="w-9 h-9 bg-surface-alt rounded-xl flex items-center justify-center shrink-0 group-hover:bg-brand-muted transition-colors">
                  <Landmark className="w-4 h-4 text-ink-dim group-hover:text-brand transition-colors" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-ink">Add bank account</p>
                  <p className="text-[11px] text-ink-dim">IBAN required for automatic payouts</p>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-dim shrink-0" />
              </button>
            </div>

            {/* Tax export — mobile only */}
            <div className="sm:hidden border-t border-border-dim p-4">
              <button onClick={exportTaxCSV} className="w-full flex items-center gap-3 group">
                <div className="w-9 h-9 bg-surface-alt rounded-xl flex items-center justify-center shrink-0 group-hover:bg-brand-muted transition-colors">
                  <FileText className="w-4 h-4 text-ink-dim group-hover:text-brand transition-colors" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-ink">Tax export</p>
                  <p className="text-[11px] text-ink-dim">Download CSV for your records</p>
                </div>
                <Download className="w-4 h-4 text-ink-dim shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
