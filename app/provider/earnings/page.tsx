'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Loader2, DollarSign, Clock, CheckCircle2, Download,
  TrendingUp, Calendar, ChevronRight, Landmark, FileText,
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
      <div className="md:hidden flex gap-1 p-1 bg-surface-alt rounded-2xl shadow-sm mb-5">
        <Link href="/provider/performance" className="flex-1 py-2 rounded-xl text-sm font-medium text-center transition-all text-ink-sub hover:text-ink">
          Performance
        </Link>
        <div className="flex-1 py-2 rounded-xl text-sm font-semibold text-center transition-all bg-white text-brand shadow-card">
          Earnings
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">Earnings & Payouts</h1>
        {/* Tax Export — desktop only in header, mobile in Payouts tab */}
        <button onClick={exportTaxCSV} className="hidden sm:flex items-center gap-2 text-sm font-medium border border-border-dim px-5 py-2.5 rounded-full hover:border-brand/30 hover:shadow-sm transition-all bg-white">
          <Download className="w-4 h-4" /> Tax Export
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-8">
        <div className="bg-brand text-white rounded-2xl p-4 sm:p-6 shadow-md">
          <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest mb-1.5 sm:mb-2">Total Earned</p>
          <p className="text-2xl sm:text-3xl font-semibold tracking-tight">€{totalNet.toFixed(2)}</p>
          <p className="text-xs sm:text-sm text-white/60 mt-1.5 sm:mt-2">{completed.length} jobs</p>
        </div>
        <div className="bg-white border border-border-dim rounded-2xl p-4 sm:p-6 shadow-sm">
          <p className="text-[10px] text-ink-dim font-bold uppercase tracking-widest mb-1.5 sm:mb-2">Pending</p>
          <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">€{pendingAmount.toFixed(2)}</p>
          <p className="text-xs sm:text-sm text-ink-sub mt-1.5 sm:mt-2">{pending.length} active jobs</p>
        </div>
        {/* Platform fee — desktop only */}
        <div className="hidden sm:block bg-white border border-border-dim rounded-2xl p-5 sm:p-6 shadow-sm">
          <p className="text-[10px] text-ink-dim font-bold uppercase tracking-widest mb-2">Platform fee</p>
          <p className="text-3xl font-semibold tracking-tight text-ink">12%</p>
          <p className="text-sm text-ink-sub mt-2">€{(totalGross * PLATFORM_FEE).toFixed(2)} total</p>
        </div>
      </div>

      {/* Earnings chart */}
      {months.length > 0 && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-border-dim p-4 sm:p-6 shadow-sm mb-5 sm:mb-8">
          <p className="font-semibold text-ink text-sm sm:text-base mb-4 sm:mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-ink-dim" /> Monthly earnings
          </p>
          <div className="flex items-end gap-1.5 sm:gap-2 h-32 sm:h-40">
            {months.map(([month, value]) => {
              const isMax = value === maxMonth;
              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-1.5 sm:gap-2">
                  <span className="text-[9px] sm:text-[10px] font-bold text-ink-dim">€{value.toFixed(0)}</span>
                  <div
                    className={`w-full rounded-t-lg transition-all ${isMax ? 'bg-brand' : 'bg-brand/60'}`}
                    style={{ height: `${(value / maxMonth) * 100}%`, minHeight: '4px' }}
                  />
                  <span className="text-[9px] sm:text-[10px] font-bold text-ink-dim uppercase">{month}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Earnings sub-tabs */}
      <div className="flex gap-1 p-1 bg-surface-alt rounded-2xl mb-5 sm:mb-8 overflow-x-auto">
        {(['overview', 'history', 'payouts'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all capitalize ${
              tab === t ? 'bg-white text-brand shadow-card font-semibold' : 'text-ink-sub hover:text-ink'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-border-dim p-4 sm:p-5 shadow-sm">
            <p className="font-bold text-sm sm:text-base mb-3 sm:mb-4">Earnings breakdown</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-ink-sub">Gross revenue</span><span className="font-semibold">€{totalGross.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-ink-sub">Platform fee (12%)</span><span className="text-ink-sub">−€{(totalGross * PLATFORM_FEE).toFixed(2)}</span></div>
              <div className="flex justify-between font-bold pt-2 border-t border-border-dim text-base sm:text-lg"><span>Net earnings</span><span>€{totalNet.toFixed(2)}</span></div>
            </div>
            {/* Payout info — integrated */}
            <div className="mt-3 pt-3 border-t border-border-dim flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-ink-dim shrink-0" />
              <p className="text-xs text-ink-sub">Paid weekly every Monday · Min €20 · Bank transfer</p>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {tab === 'history' && (
        <div className="space-y-2.5 sm:space-y-3">
          {completed.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-border p-8 sm:p-10 text-center">
              <DollarSign className="w-8 h-8 text-ink-dim mx-auto mb-2" />
              <p className="font-bold mb-1">No completed jobs yet</p>
              <p className="text-sm text-ink-dim">Earnings from completed bookings will appear here.</p>
            </div>
          ) : (
            completed.map(b => (
              <Link key={b.id} href={`/provider/jobs/${b.id}`}
                className="flex items-center gap-3 bg-white rounded-2xl border border-border-dim p-3.5 sm:p-4 hover:border-brand transition-all">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-trust-surface rounded-xl flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-trust" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{b.quote?.request?.category?.name ?? 'Service'}</p>
                  <p className="text-xs text-ink-dim flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    {new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-trust text-sm">+€{(b.totalAmount * (1 - PLATFORM_FEE)).toFixed(2)}</p>
                  <p className="text-[10px] text-ink-dim">after fee</p>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-dim shrink-0" />
              </Link>
            ))
          )}
        </div>
      )}

      {/* Payouts */}
      {tab === 'payouts' && (
        <div className="space-y-4">
          {/* Next payout */}
          <div className="bg-white rounded-2xl border border-border-dim p-4 sm:p-5 shadow-sm">
            <p className="font-bold text-sm sm:text-base mb-3 sm:mb-4">Next payout</p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-ink-sub text-sm">Next Monday</span>
              <span className="text-xl sm:text-2xl font-bold">€{Math.max(totalNet, 0).toFixed(2)}</span>
            </div>
            <div className="w-full bg-surface-alt rounded-full h-2">
              <div className="bg-brand h-2 rounded-full" style={{ width: `${Math.min((totalNet / 200) * 100, 100)}%` }} />
            </div>
            <p className="text-xs text-ink-dim mt-1">Min payout threshold: €20</p>
          </div>

          {/* Finance settings — grouped card */}
          <div className="bg-white rounded-2xl border border-border-dim shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5">
              <p className="font-bold text-sm sm:text-base mb-3 sm:mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-ink-dim" /> Payout schedule
              </p>
              <div className="space-y-2 text-sm text-ink-sub">
                <div className="flex justify-between"><span>Frequency</span><span className="font-semibold text-ink">Weekly</span></div>
                <div className="flex justify-between"><span>Day</span><span className="font-semibold text-ink">Every Monday</span></div>
                <div className="flex justify-between"><span>Method</span><span className="font-semibold text-ink">Bank transfer (SEPA)</span></div>
                <div className="flex justify-between"><span>Minimum</span><span className="font-semibold text-ink">€20.00</span></div>
                <div className="flex justify-between"><span>Processing</span><span className="font-semibold text-ink">1-2 business days</span></div>
              </div>
            </div>

            {/* Bank account */}
            <div className="border-t border-border-dim p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <Landmark className="w-4 h-4 text-ink-dim" />
                <p className="font-semibold text-sm">Bank account</p>
              </div>
              <p className="text-xs text-ink-dim mb-3">Add your IBAN to receive payouts automatically.</p>
              <button className="w-full border-2 border-dashed border-border py-2.5 sm:py-3 rounded-xl text-sm font-bold text-ink-dim hover:border-brand hover:text-ink transition-colors">
                + Add bank account
              </button>
            </div>

            {/* Tax export — mobile only (desktop has it in header) */}
            <div className="sm:hidden border-t border-border-dim">
              <button onClick={exportTaxCSV} className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface-alt transition-colors">
                <FileText className="w-4 h-4 text-ink-dim shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">Tax export</p>
                  <p className="text-xs text-ink-dim">Download CSV for your records</p>
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
