'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CustomerLayout from '@/components/CustomerLayout';
import { Loader2, Clock, Star, FileText, Search } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED:   'bg-info-surface text-info',
  IN_PROGRESS: 'bg-caution-surface text-caution',
  COMPLETED:   'bg-trust-surface text-trust',
  CANCELED:    'bg-danger-surface text-danger',
};

export default function BookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') {
      fetch('/api/bookings')
        .then(r => r.json())
        .then(d => { setBookings(Array.isArray(d) ? d : []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <Loader2 className="w-8 h-8 animate-spin text-ink-dim" />
      </div>
    );
  }

  const ongoing = bookings.filter(b => b.status === 'SCHEDULED' || b.status === 'IN_PROGRESS');
  const completed = bookings.filter(b => b.status === 'COMPLETED');

  return (
    <CustomerLayout maxWidth="max-w-2xl">
      <div className="space-y-5">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">My Bookings</h1>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-panel border border-dashed border-border-dim p-12 text-center">
            <div className="w-14 h-14 bg-canvas rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-ink-dim" />
            </div>
            <p className="font-bold mb-1">No bookings yet</p>
            <p className="text-sm text-ink-dim mb-6">Find a pro and book your first service.</p>
            <Link href="/browse" className="inline-flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-brand-dark transition-all">
              <Search className="w-4 h-4" /> Browse Pros
            </Link>
          </div>
        ) : (
          <>
            {ongoing.length > 0 && (
              <section>
                <p className="text-xs font-bold text-ink-dim uppercase tracking-widest px-1 mb-3">Ongoing</p>
                <div className="space-y-2">
                  {ongoing.map(b => <React.Fragment key={b.id}><BookingCard b={b} /></React.Fragment>)}
                </div>
              </section>
            )}

            {completed.length > 0 && (
              <section>
                <p className="text-xs font-bold text-ink-dim uppercase tracking-widest px-1 mb-3">Completed</p>
                <div className="space-y-2">
                  {completed.map(b => <React.Fragment key={b.id}><BookingCard b={b} /></React.Fragment>)}
                </div>
              </section>
            )}

            {ongoing.length === 0 && completed.length === 0 && (
              <div className="bg-white rounded-panel border border-dashed border-border-dim p-12 text-center">
                <p className="font-bold mb-1">No active bookings</p>
                <p className="text-sm text-ink-dim">Your ongoing and completed bookings will appear here.</p>
              </div>
            )}
          </>
        )}
      </div>
    </CustomerLayout>
  );
}

function BookingCard({ b }: { b: any }) {
  return (
    <Link
      href={`/bookings/${b.id}`}
      className="flex items-start gap-3 bg-white rounded-panel border border-border-dim p-4 hover:border-brand/30 hover:shadow-md transition-all"
    >
      <img
        src={b.provider?.user?.image || `https://i.pravatar.cc/60?u=${b.providerId}`}
        alt={b.provider?.user?.name}
        className="w-11 h-11 rounded-xl object-cover shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate">{b.provider?.user?.name}</p>
        <p className="text-xs text-ink-dim">{b.quote?.request?.category?.name ?? 'Service'}</p>
        <p className="text-xs text-ink-dim flex items-center gap-1 mt-0.5">
          <Clock className="w-3 h-3" />
          {new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
      <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_STYLES[b.status] ?? 'bg-surface-alt text-ink-sub'}`}>
          {b.status.replace('_', ' ')}
        </span>
        <span className="font-bold text-sm">€{b.totalAmount?.toFixed(2)}</span>
        {b.review && <Star className="w-3 h-3 text-brand fill-current" />}
      </div>
    </Link>
  );
}
