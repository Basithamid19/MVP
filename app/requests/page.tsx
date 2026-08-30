'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CustomerLayout from '@/components/CustomerLayout';
import { PageHeader } from '@/components/ui';
import { Loader2, Clock, FileText, Plus, Users, AlertCircle } from 'lucide-react';
import { localizedStatus } from '@/lib/status-labels';
import { useTranslation } from '@/lib/i18n';

export default function RequestsPage() {
  const { status } = useSession();
  const router = useRouter();
  const t = useTranslation();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') {
      fetch('/api/requests')
        .then(r => r.json())
        .then(d => { setRequests(Array.isArray(d) ? d : []); setLoading(false); })
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

  const active = requests.filter(r => ['NEW', 'CHATTING', 'QUOTED'].includes(r.status));
  const past = requests.filter(r => !['NEW', 'CHATTING', 'QUOTED'].includes(r.status));

  return (
    <CustomerLayout maxWidth="max-w-2xl">
      <div className="space-y-5">
        <PageHeader
          title={t.requestsList.title}
          className="mb-0 items-center"
          action={
            <Link
              href="/requests/new"
              className="inline-flex items-center gap-1.5 bg-brand text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-brand-dark transition-all shrink-0"
            >
              <Plus className="w-4 h-4" /> {t.requestsList.newRequest}
            </Link>
          }
        />

        {requests.length === 0 ? (
          <div className="bg-card rounded-panel border border-dashed border-border-dim p-12 text-center">
            <div className="w-14 h-14 bg-canvas rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-ink-dim" />
            </div>
            <p className="font-bold mb-1">{t.requestsList.emptyTitle}</p>
            <p className="text-sm text-ink-dim mb-6">{t.requestsList.emptyDesc}</p>
            <Link href="/requests/new" className="inline-flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-brand-dark transition-all">
              <Plus className="w-4 h-4" /> {t.requestsList.postARequest}
            </Link>
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
  const status = localizedStatus(t, 'request', r.status);
  const quoteCount = Array.isArray(r.quotes) ? r.quotes.filter((q: any) => q.status === 'PENDING').length : 0;
  return (
    <Link
      href={`/requests/${r.id}`}
      className="block bg-card rounded-panel border border-border-dim p-4 hover:border-brand/30 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <p className="font-bold text-sm text-ink">{r.category?.name ?? t.requestsList.serviceFallback}</p>
        <span className={`px-2 py-0.5 rounded-full text-3xs font-bold uppercase shrink-0 ${status.cls}`}>
          {status.label}
        </span>
      </div>
      <p className="text-xs text-ink-sub line-clamp-2 leading-relaxed mb-2">{r.description}</p>
      <div className="flex flex-wrap items-center gap-3 text-xs text-ink-dim">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(r.dateWindow).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        {quoteCount > 0 && (
          <span className="flex items-center gap-1 font-semibold text-trust">
            <Users className="w-3 h-3" /> {quoteCount} {quoteCount > 1 ? t.requestsList.quotesPlural : t.requestsList.quoteSingular}
          </span>
        )}
        {r.isUrgent && (
          <span className="flex items-center gap-1 font-semibold text-caution">
            <AlertCircle className="w-3 h-3" /> {t.hero.urgent}
          </span>
        )}
      </div>
    </Link>
  );
}
