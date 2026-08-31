'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, FileText, Clock, ChevronRight, Inbox, MessageSquare } from 'lucide-react';
import { useTranslation, type Dictionary } from '@/lib/i18n';
import { ProviderWorkTabs } from '@/components/ProviderWorkTabs';
import {
  buttonVariants, EmptyState, PageHeader, StatusBadge,
  type BadgeVariant,
} from '@/components/ui';
import { cn } from '@/lib/utils';

// The provider's sent quotes. Previously a sent quote vanished: the lead left
// the inbox and no surface showed whether it was pending, declined, expired,
// or turned into a job.

// Quote is not one of StatusBadge's domain pipelines (request/booking/payment),
// so map the four quote states onto the shared badge variants here.
function quoteState(q: any, t: Dictionary): { label: string; variant: BadgeVariant } {
  if (q.status === 'ACCEPTED') return { label: t.statuses.quote.ACCEPTED, variant: 'success' };
  if (q.status === 'DECLINED') return { label: t.statuses.quote.DECLINED, variant: 'danger' };
  if (q.expiresAt && new Date(q.expiresAt).getTime() < Date.now()) {
    return { label: t.statuses.quote.EXPIRED, variant: 'neutral' };
  }
  return { label: t.statuses.quote.PENDING, variant: 'warning' };
}

/** Still live — PENDING and not past its validity window. */
function isPending(q: any): boolean {
  return q.status === 'PENDING' && !(q.expiresAt && new Date(q.expiresAt).getTime() < Date.now());
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
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>;
  }

  const pending = quotes.filter(isPending);
  const past = quotes.filter(q => !isPending(q));

  return (
    <div className="max-w-4xl mx-auto">
      <ProviderWorkTabs active="quotes" />

      <PageHeader
        title={t.myQuotes.title}
        description={`${pending.length} ${t.myQuotes.pendingSuffix} · ${quotes.length} ${t.myQuotes.totalSuffix}`}
        className="mb-5 sm:mb-8"
      />

      {quotes.length === 0 ? (
        <div className="bg-card rounded-card sm:rounded-panel border border-dashed border-border-dim">
          <EmptyState
            icon={FileText}
            title={t.myQuotes.emptyTitle}
            description={t.myQuotes.emptyDesc}
            action={
              <Link href="/provider/leads" className={buttonVariants({ variant: 'primary', size: 'md' })}>
                <Inbox className="w-4 h-4" /> {t.providerDashboard.viewLeads}
              </Link>
            }
          />
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <section>
              <p className="text-xs font-bold uppercase tracking-widest text-ink-dim px-1 mb-3">{t.myQuotes.sectionPending}</p>
              <div className="space-y-2.5">
                {pending.map(q => <QuoteCard key={q.id} q={q} />)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <p className="text-xs font-bold uppercase tracking-widest text-ink-dim px-1 mb-3">{t.myQuotes.sectionHistory}</p>
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

  // Where a row goes. The negotiation lives in the conversation now, so every
  // quote with a thread is navigable — pending, countered, declined, expired.
  // Accepted work keeps the job page as its primary destination (that's where
  // scheduling, completion and payout live) and gets the conversation as a
  // secondary link. A quote with neither is inert and must not lift on hover.
  const jobHref = q.status === 'ACCEPTED' && q.booking?.id ? `/provider/jobs/${q.booking.id}` : null;
  const threadHref = q.threadId ? `/messages?thread=${q.threadId}` : null;
  const primaryHref = jobHref ?? threadHref;
  const primaryLabel = jobHref ? t.myQuotes.viewJob : t.negotiation.openConversation;
  const secondaryHref = jobHref && threadHref ? threadHref : null;

  const body = (
    <>
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-3xs font-bold uppercase tracking-widest bg-surface-alt text-ink-sub px-2 py-0.5 rounded-chip">
            {q.request?.category?.name ?? t.requestsList.serviceFallback}
          </span>
          <StatusBadge variant={state.variant} label={state.label} />
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
        {primaryHref && (
          <span className="flex items-center gap-1 text-xs font-bold text-brand">
            {primaryLabel} <ChevronRight className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </>
  );

  return (
    <div
      className={cn(
        'bg-card rounded-card border border-border-dim shadow-card',
        primaryHref && 'transition-all duration-150 hover:border-brand/30 hover:shadow-elevated hover:-translate-y-0.5',
      )}
    >
      {/* The card body is the primary link; the secondary sits outside it —
          an <a> can never be nested inside another <a>. */}
      {primaryHref
        ? <Link href={primaryHref} className="block p-4 sm:p-5">{body}</Link>
        : <div className="p-4 sm:p-5">{body}</div>}

      {secondaryHref && (
        <div className="px-4 sm:px-5 pb-4 -mt-1">
          <Link
            href={secondaryHref}
            className="inline-flex items-center gap-1 text-xs font-bold text-ink-sub hover:text-brand transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" /> {t.negotiation.viewConversation}
          </Link>
        </div>
      )}
    </div>
  );
}
