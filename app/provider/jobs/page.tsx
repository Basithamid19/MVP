'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, Calendar, Clock, ChevronRight, CheckCircle2,
  MapPin, DollarSign, Briefcase,
} from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED:   'bg-info-surface text-info',
  IN_PROGRESS: 'bg-caution-surface text-caution',
  COMPLETED:   'bg-trust-surface text-trust',
  CANCELED:    'bg-danger-surface text-danger',
};

export default function ProviderJobsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'completed' | 'all'>('active');

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') {
      fetch('/api/bookings')
        .then(r => r.json())
        .then(d => { setBookings(Array.isArray(d) ? d : []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  const activeCt = bookings.filter(b => b.status === 'SCHEDULED' || b.status === 'IN_PROGRESS').length;
  const completedCt = bookings.filter(b => b.status === 'COMPLETED').length;

  const filtered = bookings.filter(b => {
    if (filter === 'active') return b.status === 'SCHEDULED' || b.status === 'IN_PROGRESS';
    if (filter === 'completed') return b.status === 'COMPLETED';
    return true;
  });

  const emptyState = {
    active: { title: 'No active jobs', desc: 'Accepted quotes will appear here as scheduled work', showCta: true },
    completed: { title: 'No completed jobs yet', desc: 'Finished work will appear here after completion', showCta: false },
    all: { title: 'No jobs yet', desc: 'Jobs from accepted quotes will appear here', showCta: true },
  }[filter];

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-ink-dim" /></div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Mobile-only section tabs */}
      <div className="md:hidden flex gap-1 p-1 bg-canvas rounded-2xl border border-border-dim mb-5">
        <Link href="/provider/leads" className="flex-1 py-2.5 rounded-xl text-sm font-medium text-center transition-all text-ink-sub hover:text-ink">
          Leads
        </Link>
        <div className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center transition-all bg-white text-brand shadow-card">
          Jobs
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-8">
        <h1 className="text-xl sm:text-3xl font-semibold tracking-tight text-ink">Jobs</h1>
        <div className="flex gap-1.5">
          {([
            { key: 'active' as const, label: 'Active', count: activeCt },
            { key: 'completed' as const, label: 'Completed', count: completedCt },
            { key: 'all' as const, label: 'All', count: bookings.length },
          ]).map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${
                filter === f.key
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-white text-ink-sub border border-border-dim hover:text-ink'
              }`}>
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-dashed border-border-dim p-6 sm:p-10 text-center">
          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-surface-alt rounded-full flex items-center justify-center mx-auto mb-3">
            <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-ink-dim" />
          </div>
          <p className="font-semibold text-base mb-1 text-ink">{emptyState.title}</p>
          <p className="text-sm text-ink-sub mb-4">{emptyState.desc}</p>
          {emptyState.showCta && (
            <Link href="/provider/leads" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-dark transition-colors">
              Browse Leads <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2.5 sm:space-y-3">
          {filtered.map(b => (
            <Link key={b.id} href={`/provider/jobs/${b.id}`}
              className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-white rounded-2xl border border-border-dim p-4 sm:p-5 hover:border-brand/30 transition-all shadow-sm hover:shadow-md">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0 ${
                  b.status === 'IN_PROGRESS' ? 'bg-caution' :
                  b.status === 'COMPLETED' ? 'bg-trust' :
                  b.status === 'CANCELED' ? 'bg-danger' : 'bg-info'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-semibold text-[15px] sm:text-base truncate text-ink">{b.quote?.request?.category?.name ?? 'Job'}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${STATUS_STYLES[b.status] ?? 'bg-surface-alt text-ink-sub'}`}>
                      {b.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="hidden sm:flex text-sm text-ink-sub items-center gap-1.5 mb-1">
                    <MapPin className="w-4 h-4 shrink-0" />
                    {b.quote?.request?.address ?? '—'}
                  </p>
                  <p className="text-xs sm:text-sm text-ink-sub flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {new Date(b.scheduledAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 ml-5.5 sm:ml-0 pl-0 sm:pl-0">
                <div className="text-left sm:text-right shrink-0">
                  <p className="font-semibold text-[15px] sm:text-base text-ink">€{(b.totalAmount * 0.88).toFixed(2)}</p>
                  <p className="text-[11px] sm:text-xs text-ink-dim">your share</p>
                </div>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-ink-dim shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
