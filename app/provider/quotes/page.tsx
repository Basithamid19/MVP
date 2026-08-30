'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, FileText, Clock, ChevronRight, Inbox } from 'lucide-react';
import { useTranslation, type Dictionary } from '@/lib/i18n';
import { PageHeader } from '@/components/ui';

// The provider's sent quotes. Previously a sent quote vanished: the lead left
// the inbox and no surface showed whether it was pending, declined, expired,
// or turned into a job.

function quoteState(q: any, t: Dictionary): { label: string; cls: string } {
  if (q.status === 'ACCEPTED') return { label: t.statuses.quote.ACCEPTED, cls: 'bg-trust-surface text-trust' };
  if (q.status === 'DECLINED') return { label: t.statuses.quote.DECLINED, cls: 'bg-surface-alt text-ink-sub' };
  if (q.expiresAt && new Date(q.expiresAt).getTime() < Date.now()) {
    return { label: t.statuses.quote.EXPIRED, cls: 'bg-surface-alt text-ink-dim' };
  }
  return { label: t.statuses.quote.PENDING, cls: 'bg-info-surface text-info' };
}

function expiryLine(q: any, t: Dictionary): string | null {
  if (q.status !== 'PENDING' || !q.expiresAt) return null;
  const ms = new Date(q.expiresAt).getTime() - Date.now();
  if (ms <= 0) return null;
  const hours = Math.floor(ms / 3600000);
  return hours < 24
    ? `${t.quoteInbox.expiresIn} ${Math.max(1, hours)}${t.quoteInbox.hoursShort}`
    : `${t.quoteInbox.expiresIn} ${Math.floor(hours / 24)}${t.quoteInbox.daysShort}`;
}

export default function ProviderQuotesPage() {
  const { status } = useSession();
  const router = useRouter();
  const t = useTranslation();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') {
      fetch('/api/quotes')
        .then(r => r.json())
        .then(d => { setQuotes(Array.isArray(d) ? d : []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  if (status === 'loading' || loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-ink-dim" /></div>;
  }

  const isPending = (q: any) => q.status === 'PENDING' && !(q.expiresAt && new Date(q.expiresAt).getTime() < Date.now());
  const pending = quotes.filter(isPending);
  const past = quotes.filter(q => !isPending(q));

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title={t.myQuotes.title}
        description={`${pending.length} ${t.myQuotes.pendingSuffix} · ${quotes.length} ${t.myQuotes.totalSuffix}`}
        className="mb-5 sm:mb-8"
      />

      {quotes.length === 0 ? (
        <div className="bg-card rounded-card sm:rounded-panel border border-dashed border-border-dim p-6 sm:p-10 text-center">
          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-surface-alt rounded-full flex items-center justify-center mx-auto mb-3">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-ink-dim" />
          </div>
          <p className="font-semibold text-base mb-1 text-ink">{t.myQuotes.emptyTitle}</p>
          <p className="text-sm text-ink-sub mb-5">{t.myQuotes.emptyDesc}</p>
          <Link href="/provider/leads" className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-brand-dark transition-all">
            <Inbox className="w-4 h-4" /> {t.providerDashboard.viewLeads}
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <section>
              <p className="text-xs font-bold text-ink-dim uppercase tracking-widest px-1 mb-3">{t.myQuotes.sectionPending}</p>
              <div className="space-y-2.5">
                {pending.map(q => <QuoteCard key={q.id} q={q} />)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <p className="text-xs font-bold text-ink-dim uppercase tracking-widest px-1 mb-3">{t.myQuotes.sectionHistory}</p>
              <div className="space-y-2.5">
                {past.map(q => <QuoteCard key={q.id} q={q} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function QuoteCard({ q }: { q: any }) {
  const t = useTranslation();
  const state = quoteState(q, t);
  const expiry = expiryLine(q, t);
  const inner = (
    <div className="bg-card rounded-card border border-border-dim p-4 sm:p-5 hover:border-brand/30 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-3xs font-bold uppercase tracking-widest bg-surface-alt text-ink-sub px-2 py-0.5 rounded-full">
            {q.request?.category?.name ?? t.requestsList.serviceFallback}
          </span>
          <span className={`text-3xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${state.cls}`}>
            {state.label}
          </span>
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-base text-ink">€{q.price?.toFixed(2)}</p>
          {expiry && <p className="text-2xs text-caution mt-0.5">{expiry}</p>}
        </div>
      </div>
      <p className="text-sm text-ink-sub line-clamp-2 leading-relaxed mb-2">{q.request?.description}</p>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1 text-xs text-ink-dim">
          <Clock className="w-3 h-3" />
          {t.myQuotes.sentPrefix} {new Date(q.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
        {q.status === 'ACCEPTED' && q.booking?.id && (
          <span className="flex items-center gap-1 text-xs font-bold text-trust">
            {t.myQuotes.viewJob} <ChevronRight className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </div>
  );

  return q.status === 'ACCEPTED' && q.booking?.id
    ? <Link href={`/provider/jobs/${q.booking.id}`} className="block">{inner}</Link>
    : inner;
}
