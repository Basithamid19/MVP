'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Loader2, DollarSign, Clock, CheckCircle2, Download,
  TrendingUp, Calendar, AlertCircle, ChevronRight,
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

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>;

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
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Earnings & Payouts</h1>
        <button onClick={exportTaxCSV} className="flex items-center gap-2 text-sm font-bold border border-gray-200 px-4 py-2 rounded-xl hover:border-black transition-colors">
          <Download className="w-4 h-4" /> Tax Export
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-black text-white rounded-2xl p-5">
          <p className="text-xs text-white/60 font-bold uppercase tracking-widest mb-1">Total Earned</p>
          <p className="text-2xl font-bold">€{totalNet.toFixed(2)}</p>
          <p className="text-xs text-white/40 mt-1">{completed.length} jobs</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Pending</p>
          <p className="text-2xl font-bold">€{pendingAmount.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">{pending.length} active jobs</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Platform fee</p>
          <p className="text-2xl font-bold">12%</p>
          <p className="text-xs text-gray-400 mt-1">€{(totalGross * PLATFORM_FEE).toFixed(2)} total</p>
        </div>
      </div>

      {/* Earnings chart */}
      {months.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm mb-6">
          <p className="font-bold mb-5 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Monthly earnings</p>
          <div className="flex items-end gap-2 h-32">
            {months.map(([month, value]) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-black rounded-t-lg transition-all"
                  style={{ height: `${(value / maxMonth) * 100}%`, minHeight: '4px' }}
                />
                <span className="text-[9px] font-bold text-gray-400 uppercase">{month}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white rounded-2xl border border-gray-100 mb-5">
        {(['overview', 'history', 'payouts'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all capitalize ${tab === t ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="font-bold mb-4">Earnings breakdown</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Gross revenue</span><span className="font-semibold">€{totalGross.toFixed(2)}</span></div>
              <div className="flex justify-between text-red-500"><span>Platform fee (12%)</span><span>- €{(totalGross * PLATFORM_FEE).toFixed(2)}</span></div>
              <div className="flex justify-between font-bold pt-2 border-t border-gray-100 text-lg"><span>Net earnings</span><span>€{totalNet.toFixed(2)}</span></div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-blue-900">Payout schedule</p>
              <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                Earnings are paid out weekly every Monday via bank transfer. Minimum payout threshold: €20. Tax documents are available for export above.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {tab === 'history' && (
        <div className="space-y-3">
          {completed.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
              <DollarSign className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="font-bold mb-1">No completed jobs yet</p>
              <p className="text-sm text-gray-400">Earnings from completed bookings will appear here.</p>
            </div>
          ) : (
            completed.map(b => (
              <Link key={b.id} href={`/provider/jobs/${b.id}`}
                className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4 hover:border-black transition-all">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{b.quote?.request?.category?.name ?? 'Service'}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    {new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-green-700">+€{(b.totalAmount * (1 - PLATFORM_FEE)).toFixed(2)}</p>
                  <p className="text-[10px] text-gray-400">after fee</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
              </Link>
            ))
          )}
        </div>
      )}

      {/* Payouts */}
      {tab === 'payouts' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="font-bold mb-4">Upcoming payout</p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">Next Monday</span>
              <span className="text-2xl font-bold">€{Math.max(totalNet - 0, 0).toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-black h-2 rounded-full" style={{ width: `${Math.min((totalNet / 200) * 100, 100)}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-1">Min payout threshold: €20</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="font-bold mb-4 flex items-center gap-2"><Clock className="w-4 h-4" /> Payout schedule</p>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between"><span>Frequency</span><span className="font-semibold">Weekly</span></div>
              <div className="flex justify-between"><span>Day</span><span className="font-semibold">Every Monday</span></div>
              <div className="flex justify-between"><span>Method</span><span className="font-semibold">Bank transfer (SEPA)</span></div>
              <div className="flex justify-between"><span>Minimum</span><span className="font-semibold">€20.00</span></div>
              <div className="flex justify-between"><span>Processing</span><span className="font-semibold">1-2 business days</span></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="font-bold mb-3">Bank account</p>
            <p className="text-sm text-gray-400 mb-3">Add your IBAN to receive payouts automatically.</p>
            <button className="w-full border-2 border-dashed border-gray-200 py-3 rounded-xl text-sm font-bold text-gray-400 hover:border-black hover:text-black transition-colors">
              + Add bank account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
