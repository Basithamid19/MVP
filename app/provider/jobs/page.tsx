'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Loader2, Calendar, ChevronRight, MapPin, Briefcase } from 'lucide-react';
import { formatVilnius } from '@/lib/time';
import { providerNet } from '@/lib/fees';
import { useTranslation } from '@/lib/i18n';
import { ProviderWorkTabs } from '@/components/ProviderWorkTabs';
import { PageHeader, EmptyState, DomainStatusBadge, buttonVariants } from '@/components/ui';
import { SegmentedFilter } from '@/components/SegmentedFilter';

export default function ProviderJobsPage() {
  const { data: session, status } = useSession();
  const t = useTranslation();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'completed' | 'all'>('active');

  useEffect(() => {
    // middleware owns the auth gate here; client 'unauthenticated' may be transient.
    if (status === 'authenticated') {
      fetch('/api/bookings')
        .then(r => r.json())
        .then(d => { setBookings(Array.isArray(d) ? d : []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status]);

  const activeCt = bookings.filter(b => b.status === 'SCHEDULED' || b.status === 'IN_PROGRESS').length;
  const completedCt = bookings.filter(b => b.status === 'COMPLETED').length;

  const filtered = bookings.filter(b => {
    if (filter === 'active') return b.status === 'SCHEDULED' || b.status === 'IN_PROGRESS';
    if (filter === 'completed') return b.status === 'COMPLETED';
    return true;
  });

  const emptyState = {
    active: { title: t.jobsPage.emptyActiveTitle, desc: t.jobsPage.emptyActiveDesc, showCta: true },
    completed: { title: t.jobsPage.emptyCompletedTitle, desc: t.jobsPage.emptyCompletedDesc, showCta: false },
    all: { title: t.jobsPage.emptyAllTitle, desc: t.jobsPage.emptyAllDesc, showCta: true },
  }[filter];

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-ink-dim" /></div>;

  return (
    <div className="max-w-3xl mx-auto">
      <ProviderWorkTabs active="jobs" />

      <PageHeader
        title={t.jobsPage.title}
        className="flex-col items-start sm:flex-row sm:items-center gap-3 sm:gap-4 mb-5 sm:mb-8"
        action={
          <SegmentedFilter
            value={filter}
            onChange={id => setFilter(id as typeof filter)}
            options={[
              { id: 'active', label: t.jobsPage.filterActive, count: activeCt },
              { id: 'completed', label: t.jobsPage.filterCompleted, count: completedCt },
              { id: 'all', label: t.jobsPage.filterAll, count: bookings.length },
            ]}
          />
        }
      />

      {filtered.length === 0 ? (
        <div className="bg-card rounded-card sm:rounded-panel border border-dashed border-border-dim">
          <EmptyState
            icon={Briefcase}
            title={emptyState.title}
            description={emptyState.desc}
            action={emptyState.showCta ? (
              <Link href="/provider/leads" className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
                {t.providerDashboard.browseLeads} <ChevronRight className="w-4 h-4" />
              </Link>
            ) : undefined}
          />
        </div>
      ) : (
        <div className="space-y-2.5 sm:space-y-3">
          {filtered.map(b => (
            <Link key={b.id} href={`/provider/jobs/${b.id}`}
              className="block bg-card rounded-card border border-border-dim p-4 sm:p-5 hover:border-brand/30 transition-all shadow-card hover:shadow-elevated">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-semibold text-base truncate text-ink">{b.quote?.request?.category?.name ?? t.providerDashboard.jobFallback}</p>
                    <DomainStatusBadge kind="booking" status={b.status} dict={t} />
                  </div>
                  {/* Location matters most on the phone the pro is standing
                      with — it used to be desktop-only. */}
                  <p className="text-xs sm:text-sm text-ink-sub flex items-center gap-1.5 min-w-0">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span className="truncate">{b.quote?.request?.address ?? '—'}</span>
                  </p>
                  <p className="text-xs sm:text-sm text-ink-sub flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    {formatVilnius(b.scheduledAt, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <div className="text-right">
                    <p className="font-semibold text-base text-ink">€{providerNet(b.totalAmount).toFixed(2)}</p>
                    <p className="text-2xs sm:text-xs text-ink-dim">{t.jobsPage.yourShare}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-ink-dim" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
