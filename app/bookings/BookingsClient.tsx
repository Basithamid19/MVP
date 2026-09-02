'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import CustomerLayout from '@/components/CustomerLayout';
import {
  Avatar, DomainStatusBadge, EmptyState, PageHeader, SkeletonCard, buttonVariants,
} from '@/components/ui';
import { Clock, Star, FileText, Search } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { fetchJsonOr } from '@/lib/fetch-retry';

/* Anything that isn't live work belongs in history — CANCELED bookings used to
 * be filtered out of both sections and became unreachable from this page. */
const ONGOING = ['SCHEDULED', 'IN_PROGRESS'];

export default function BookingsClient({
  initialBookings = [],
}: {
  initialBookings?: any[];
} = {}) {
  const { status } = useSession();
  const t = useTranslation();
  const hasInitial = initialBookings.length > 0;
  const [bookings, setBookings] = useState<any[]>(initialBookings);
  const [loading, setLoading] = useState(!hasInitial);

  useEffect(() => {
    // middleware owns the auth gate here; client 'unauthenticated' may be transient.
    if (status !== 'authenticated') return;
    // Server already rendered us with bookings — skip the refetch on first mount.
    if (hasInitial) { setLoading(false); return; }
    // Retried on cold-start / 5xx so a single blip doesn't show "no bookings"
    // to a customer who has bookings.
    fetchJsonOr<any[]>('/api/bookings', [])
      .then(d => { setBookings(Array.isArray(d) ? d : []); setLoading(false); });
  }, [status, hasInitial]);

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <CustomerLayout maxWidth="max-w-2xl">
        <div className="space-y-5">
          <PageHeader title={t.bookingsList.title} className="mb-0" />
          <div className="space-y-2">
            {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
          </div>
        </div>
      </CustomerLayout>
    );
  }

  const ongoing = bookings.filter(b => ONGOING.includes(b.status));
  const past = bookings.filter(b => !ONGOING.includes(b.status));

  return (
    <CustomerLayout maxWidth="max-w-2xl">
      <div className="space-y-5">
        <PageHeader title={t.bookingsList.title} className="mb-0" />

        {bookings.length === 0 ? (
          <div className="bg-card rounded-panel border border-dashed border-border-dim">
            <EmptyState
              icon={FileText}
              size="lg"
              title={t.bookingsList.emptyTitle}
              description={t.bookingsList.emptyDesc}
              action={
                <Link href="/browse" className={buttonVariants({ variant: 'primary', size: 'lg' })}>
                  <Search className="w-4 h-4" /> {t.bookingsList.browsePros}
                </Link>
              }
            />
          </div>
        ) : (
          <>
            {ongoing.length > 0 && (
              <section>
                <p className="text-xs font-bold text-ink-dim uppercase tracking-widest px-1 mb-3">{t.bookingsList.ongoing}</p>
                <div className="space-y-2">
                  {ongoing.map(b => <BookingCard key={b.id} b={b} />)}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section>
                <p className="text-xs font-bold text-ink-dim uppercase tracking-widest px-1 mb-3">{t.bookingsList.past}</p>
                <div className="space-y-2">
                  {past.map(b => <BookingCard key={b.id} b={b} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </CustomerLayout>
  );
}

function BookingCard({ b }: { b: any }) {
  const t = useTranslation();
  const providerName = b.provider?.user?.name ?? '';
  const service = b.quote?.request?.category?.name ?? t.requestsList.serviceFallback;
  const rating = typeof b.review?.rating === 'number' ? b.review.rating : null;

  return (
    <Link
      href={`/bookings/${b.id}`}
      className="flex items-start gap-3 bg-card rounded-panel border border-border-dim p-4 hover:border-brand/30 hover:shadow-elevated transition-all"
    >
      <Avatar src={b.provider?.user?.image} name={providerName} size="md" shape="square" />

      <div className="flex-1 min-w-0">
        {/* The booked service is what the customer is scanning for; the pro's
            name is supporting detail. */}
        <p className="font-bold text-sm text-ink truncate">{service}</p>
        <p className="text-xs text-ink-sub truncate mt-0.5">{providerName}</p>
        <p className="text-xs text-ink-dim flex items-center gap-1 mt-1">
          <Clock className="w-3 h-3 shrink-0" />
          {new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>

      <div className="shrink-0 flex flex-col items-end gap-1.5">
        <span className="font-bold text-sm text-ink leading-tight">€{b.totalAmount?.toFixed(2)}</span>
        <DomainStatusBadge kind="booking" status={b.status} dict={t} />
        {rating !== null && (
          <span className="flex items-center gap-1 text-2xs font-semibold text-ink-sub">
            <Star className="w-3 h-3 text-brand fill-current" /> {rating.toFixed(1)}
          </span>
        )}
      </div>
    </Link>
  );
}
