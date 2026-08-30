'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CustomerLayout from '@/components/CustomerLayout';
import { Loader2, Clock, Star, FileText, Search } from 'lucide-react';
import { avatarUrl } from '@/lib/avatar';
import { localizedStatus } from '@/lib/status-labels';
import { useTranslation } from '@/lib/i18n';

export default function BookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslation();
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
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{t.bookingsList.title}</h1>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-panel border border-dashed border-border-dim p-12 text-center">
            <div className="w-14 h-14 bg-canvas rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-ink-dim" />
            </div>
            <p className="font-bold mb-1">{t.bookingsList.emptyTitle}</p>
            <p className="text-sm text-ink-dim mb-6">{t.bookingsList.emptyDesc}</p>
            <Link href="/browse" className="inline-flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-brand-dark transition-all">
              <Search className="w-4 h-4" /> {t.bookingsList.browsePros}
            </Link>
          </div>
        ) : (
          <>
            {ongoing.length > 0 && (
              <section>
                <p className="text-xs font-bold text-ink-dim uppercase tracking-widest px-1 mb-3">{t.bookingsList.ongoing}</p>
                <div className="space-y-2">
                  {ongoing.map(b => <React.Fragment key={b.id}><BookingCard b={b} /></React.Fragment>)}
                </div>
              </section>
            )}

            {completed.length > 0 && (
              <section>
                <p className="text-xs font-bold text-ink-dim uppercase tracking-widest px-1 mb-3">{t.bookingsList.completed}</p>
                <div className="space-y-2">
                  {completed.map(b => <React.Fragment key={b.id}><BookingCard b={b} /></React.Fragment>)}
                </div>
              </section>
            )}

            {ongoing.length === 0 && completed.length === 0 && (
              <div className="bg-white rounded-panel border border-dashed border-border-dim p-12 text-center">
                <p className="font-bold mb-1">{t.bookingsList.noActiveTitle}</p>
                <p className="text-sm text-ink-dim">{t.bookingsList.noActiveDesc}</p>
              </div>
            )}
          </>
        )}
      </div>
    </CustomerLayout>
  );
}

function BookingCard({ b }: { b: any }) {
  const t = useTranslation();
  return (
    <Link
      href={`/bookings/${b.id}`}
      className="flex items-start gap-3 bg-white rounded-panel border border-border-dim p-4 hover:border-brand/30 hover:shadow-md transition-all"
    >
      <img
        src={b.provider?.user?.image || avatarUrl(b.provider?.user?.name, 80)}
        alt={b.provider?.user?.name}
        className="w-11 h-11 rounded-xl object-cover shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate">{b.provider?.user?.name}</p>
        <p className="text-xs text-ink-dim">{b.quote?.request?.category?.name ?? t.requestsList.serviceFallback}</p>
        <p className="text-xs text-ink-dim flex items-center gap-1 mt-0.5">
          <Clock className="w-3 h-3" />
          {new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
      <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
        <span className={`px-2 py-0.5 rounded-full text-3xs font-bold uppercase ${localizedStatus(t, 'booking', b.status).cls}`}>
          {localizedStatus(t, 'booking', b.status).label}
        </span>
        <span className="font-bold text-sm">€{b.totalAmount?.toFixed(2)}</span>
        {b.review && <Star className="w-3 h-3 text-brand fill-current" />}
      </div>
    </Link>
  );
}
