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
  SCHEDULED:   'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-orange-100 text-orange-700',
  COMPLETED:   'bg-green-100 text-green-700',
  CANCELED:    'bg-red-100 text-red-600',
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

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>;

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
        <div className="flex gap-1 p-1 bg-white rounded-xl border border-gray-100">
          {(['active', 'completed', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${filter === f ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 text-center">
          <CheckCircle2 className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="font-bold mb-1">No {filter === 'all' ? '' : filter} jobs</p>
          <p className="text-sm text-gray-400">Jobs from accepted quotes will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => (
            <Link key={b.id} href={`/provider/jobs/${b.id}`}
              className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 hover:border-black transition-all shadow-sm">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                b.status === 'IN_PROGRESS' ? 'bg-orange-500' :
                b.status === 'COMPLETED' ? 'bg-green-500' :
                b.status === 'CANCELED' ? 'bg-red-400' : 'bg-blue-500'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-sm truncate">{b.quote?.request?.category?.name ?? 'Job'}</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${STATUS_STYLES[b.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {b.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {b.quote?.request?.address ?? '—'}
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  {new Date(b.scheduledAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-sm">€{(b.totalAmount * 0.88).toFixed(2)}</p>
                <p className="text-[10px] text-gray-400">your share</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
