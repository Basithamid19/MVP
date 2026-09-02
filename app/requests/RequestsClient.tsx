'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CustomerLayout from '@/components/CustomerLayout';
import {
  DomainStatusBadge, EmptyState, PageHeader, SkeletonCard, buttonVariants,
} from '@/components/ui';
import { Clock, FileText, Plus, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { fetchJsonOr } from '@/lib/fetch-retry';

const ACTIVE = ['NEW', 'CHATTING', 'QUOTED'];

export default function RequestsClient({
  initialRequests = [],
}: {
  initialRequests?: any[];
} = {}) {
  const { status } = useSession();
  const router = useRouter();
  const t = useTranslation();
  const hasInitial = initialRequests.length > 0;
  const [requests, setRequests] = useState<any[]>(initialRequests);
  const [loading, setLoading] = useState(!hasInitial);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status !== 'authenticated') return;
    if (hasInitial) { setLoading(false); return; }
    // Retried on cold-start / 5xx so a single blip doesn't show "no requests"
    // to a customer who has requests.
    fetchJsonOr<any[]>('/api/requests', [])
      .then(d => { setRequests(Array.isArray(d) ? d : []); setLoading(false); });
  }, [status, router, hasInitial]);

  const header = (
    <PageHeader
      title={t.requestsList.title}
      className="mb-0"
      action={
        <Link href="/requests/new" className={buttonVariants({ variant: 'primary', size: 'md' })}>
          <Plus className="w-4 h-4" /> {t.requestsList.newRequest}
        </Link>
      }
    />
  );

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <CustomerLayout maxWidth="max-w-2xl">
        <div className="space-y-5">
          {header}
          <div className="space-y-2">
            {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
          </div>
        </div>
      </CustomerLayout>
    );
  }

  const active = requests.filter(r => ACTIVE.includes(r.status));
  const past = requests.filter(r => !ACTIVE.includes(r.status));

  return (
    <CustomerLayout maxWidth="max-w-2xl">
      <div className="space-y-5">
        {header}

        {requests.length === 0 ? (
          <div className="bg-card rounded-panel border border-dashed border-border-dim">
            <EmptyState
              icon={FileText}
              size="lg"
              title={t.requestsList.emptyTitle}
              description={t.requestsList.emptyDesc}
              action={
                <Link href="/requests/new" className={buttonVariants({ variant: 'primary', size: 'lg' })}>
                  <Plus className="w-4 h-4" /> {t.requestsList.postARequest}
                </Link>
              }
            />
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <section>
                <p className="text-xs font-bold text-ink-dim uppercase tracking-widest px-1 mb-3">{t.requestsList.active}</p>
                <div className="space-y-2">
                  {active.map(r => <RequestCard key={r.id} r={r} />)}
                </div>
              </section>
            )}
            {past.length > 0 && (
              <section>
                <p className="text-xs font-bold text-ink-dim uppercase tracking-widest px-1 mb-3">{t.requestsList.past}</p>
                <div className="space-y-2">
                  {past.map(r => <RequestCard key={r.id} r={r} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </CustomerLayout>
  );
}

function RequestCard({ r }: { r: any }) {
  const t = useTranslation();
  const quoteCount = Array.isArray(r.quotes) ? r.quotes.filter((q: any) => q.status === 'PENDING').length : 0;

  return (
    <Link
      href={`/requests/${r.id}`}
      className="block bg-card rounded-panel border border-border-dim p-4 hover:border-brand/30 hover:shadow-elevated transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <p className="font-bold text-sm text-ink min-w-0 truncate">{r.category?.name ?? t.requestsList.serviceFallback}</p>
        <DomainStatusBadge kind="request" status={r.status} dict={t} />
      </div>

      <p className="text-xs text-ink-sub line-clamp-2 leading-relaxed mb-2.5">{r.description}</p>

      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-dim">
        {/* Waiting quotes are the reason to tap this row — give them a chip. */}
        {quoteCount > 0 && (
          <span className="inline-flex items-center gap-1 bg-brand-muted text-brand font-bold px-2.5 py-1 rounded-chip">
            {quoteCount} {quoteCount > 1 ? t.requestsList.quotesPlural : t.requestsList.quoteSingular}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 shrink-0" />
          {new Date(r.dateWindow).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        {r.isUrgent && (
          <span className="flex items-center gap-1 font-semibold text-caution">
            <AlertCircle className="w-3 h-3 shrink-0" /> {t.hero.urgent}
          </span>
        )}
      </div>
    </Link>
  );
}
