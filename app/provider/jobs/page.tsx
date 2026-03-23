'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, Calendar, Clock, ChevronRight, CheckCircle2,
  MapPin, DollarSign,
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

  const filtered = bookings.filter(b => {
    if (filter === 'active') return b.status === 'SCHEDULED' || b.status === 'IN_PROGRESS';
    if (filter === 'completed') return b.status === 'COMPLETED';
    return true;
  });

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-ink-dim" /></div>;

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Mobile-only section tabs */}
      <div className="md:hidden flex gap-1 p-1.5 bg-white rounded-2xl border border-border-dim shadow-sm mb-6">
        <Link href="/provider/leads" className="flex-1 py-2 rounded-xl text-sm font-medium text-center transition-all text-ink-sub hover:text-ink">
          Leads
        </Link>
        <div className="flex-1 py-2 rounded-xl text-sm font-medium text-center transition-all bg-surface-alt text-ink shadow-sm border border-border-dim">
          Jobs
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">Jobs</h1>
        <div className="flex gap-1 p-1.5 bg-white rounded-xl sm:rounded-2xl border border-border-dim shadow-sm overflow-x-auto">
          {(['active', 'completed', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all capitalize whitespace-nowrap ${filter === f ? 'bg-surface-alt text-ink shadow-sm border border-border-dim' : 'text-ink-sub hover:text-ink border border-transparent'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-dashed border-border-dim p-8 sm:p-12 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-surface-alt rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-ink-dim" />
          </div>
          <p className="font-semibold text-base mb-1 text-ink">No {filter === 'all' ? '' : filter} jobs</p>
          <p className="text-sm text-ink-sub">Jobs from accepted quotes will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => (
            <Link key={b.id} href={`/provider/jobs/${b.id}`}
              className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white rounded-2xl border border-border-dim p-5 hover:border-brand/30 transition-all shadow-sm hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full shrink-0 ${
                  b.status === 'IN_PROGRESS' ? 'bg-caution' :
                  b.status === 'COMPLETED' ? 'bg-trust' :
                  b.status === 'CANCELED' ? 'bg-danger' : 'bg-info'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <p className="font-semibold text-base truncate text-ink">{b.quote?.request?.category?.name ?? 'Job'}</p>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase shrink-0 ${STATUS_STYLES[b.status] ?? 'bg-surface-alt text-ink-sub'}`}>
                      {b.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-ink-sub truncate flex items-center gap-1.5 mb-1">
                    <MapPin className="w-4 h-4 shrink-0" />
                    {b.quote?.request?.address ?? '—'}
                  </p>
                  <p className="text-sm text-ink-sub flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {new Date(b.scheduledAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0 pt-4 sm:pt-0 border-t border-border-dim sm:border-0">
                <div className="text-left sm:text-right shrink-0">
                  <p className="font-semibold text-base text-ink">€{(b.totalAmount * 0.88).toFixed(2)}</p>
                  <p className="text-xs text-ink-dim">your share</p>
                </div>
                <ChevronRight className="w-5 h-5 text-ink-dim shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
