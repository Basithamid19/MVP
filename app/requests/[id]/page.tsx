'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import CustomerLayout from '@/components/CustomerLayout';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, ShieldCheck, Clock, MapPin,
  CheckCircle2, MessageSquare, SearchX,
  RefreshCcw, ChevronRight, TrendingDown,
} from 'lucide-react';

import {
  Avatar, Button, buttonVariants, Card, DomainStatusBadge, EmptyState,
  PageHeader, Skeleton, StatusBadge, type BadgeVariant,
} from '@/components/ui';
import { useTranslation } from '@/lib/i18n';
import type { Dictionary } from '@/lib/i18n/types';

/* ─── Quote summary (app/requests/[id]) ──────────────────────────────────────
 * NOT a negotiation surface. Accept / counter / decline all live on the offer
 * card inside the conversation (/messages) — one home for the deal, one
 * history, one turn indicator. This page is the request's index: what was
 * asked, what the prices look like, and a way into each conversation.
 * ────────────────────────────────────────────────────────────────────────── */

/** effectivePrice — the latest countered figure, or the provider's original ask. */
const effectivePrice = (q: any): number => q?.currentPrice ?? q?.price ?? 0;

function isExpired(q: any): boolean {
  return !!q?.expiresAt && new Date(q.expiresAt).getTime() < Date.now();
}

function expiresLabel(
  expiresAt: string | null | undefined,
  s: Dictionary['quoteInbox'],
): string | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return s.expired;
  const hours = Math.floor(ms / 3600000);
  if (hours < 24) return `${s.expiresIn} ${Math.max(1, hours)}${s.hoursShort}`;
  return `${s.expiresIn} ${Math.floor(hours / 24)}${s.daysShort}`;
}

/** True while the quote is inside its last 24 hours — the only case worth shouting about. */
function expiresSoon(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return ms <= 0 || ms < 24 * 3600000;
}

/* Quote isn't one of DomainStatusBadge's pipelines (request/booking/payment),
   so map the four quote states onto the shared badge variants here — same
   mapping the provider's own quote list uses. */
function quoteState(q: any, t: Dictionary): { label: string; variant: BadgeVariant } {
  if (q.status === 'ACCEPTED') return { label: t.statuses.quote.ACCEPTED, variant: 'success' };
  if (q.status === 'DECLINED') return { label: t.statuses.quote.DECLINED, variant: 'danger' };
  if (isExpired(q)) return { label: t.statuses.quote.EXPIRED, variant: 'neutral' };
  return { label: t.statuses.quote.PENDING, variant: 'warning' };
}

export default function QuoteInboxPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslation();
  const s = t.quoteInbox;
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [targetProviderName, setTargetProviderName] = useState<string | null>(null);

  // For direct requests, resolve the target pro's name for the waiting copy.
  useEffect(() => {
    if (!request?.targetProviderId) return;
    fetch(`/api/providers?id=${request.targetProviderId}`)
      .then(r => r.json())
      .then(d => { if (d?.user?.name) setTargetProviderName(d.user.name); })
      .catch(() => {});
  }, [request?.targetProviderId]);

  const load = useCallback(() => {
    fetch(`/api/requests?id=${id}`)
      .then(r => r.json())
      .then(d => { setRequest(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <CustomerLayout maxWidth="max-w-2xl">
        <div className="space-y-5">
          <Skeleton rounded="chip" className="h-8 w-44" />
          <Skeleton rounded="panel" className="h-36 w-full" />
          <Skeleton rounded="panel" className="h-24 w-full" />
          <Skeleton rounded="panel" className="h-24 w-full" />
        </div>
      </CustomerLayout>
    );
  }

  if (!request) {
    return (
      <CustomerLayout maxWidth="max-w-2xl">
        <EmptyState
          icon={SearchX}
          size="lg"
          title={s.notFound}
          action={
            <Link href="/dashboard" className={buttonVariants({ variant: 'secondary', size: 'md' })}>
              {t.common.backToDashboard}
            </Link>
          }
        />
      </CustomerLayout>
    );
  }

  const allQuotes: any[] = request.quotes ?? [];
  const liveQuotes = allQuotes.filter(q => q.status === 'PENDING' && !isExpired(q));
  const expiredCount = allQuotes.filter(q => q.status === 'PENDING' && isExpired(q)).length;
  const acceptedQuote = allQuotes.find(q => q.status === 'ACCEPTED');

  // Range reflects what's actually on the table: live quotes at their latest
  // countered price, not the original asks.
  const prices = liveQuotes.map(effectivePrice).filter(Boolean);
  const minPrice = prices.length ? Math.min(...prices) : null;
  const maxPrice = prices.length ? Math.max(...prices) : null;

  // Live offers first (they're the ones needing a decision), then history.
  const rows = allQuotes.slice().sort((a, b) => {
    const aLive = a.status === 'PENDING' && !isExpired(a);
    const bLive = b.status === 'PENDING' && !isExpired(b);
    if (aLive !== bLive) return aLive ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <CustomerLayout maxWidth="max-w-2xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="-ml-2 mb-3"
      >
        <ArrowLeft className="w-4 h-4" /> {t.common.back}
      </Button>

      <div className="space-y-5">
        <PageHeader
          title={s.title}
          description={request.category?.name}
          className="mb-0"
          action={
            <>
              <DomainStatusBadge kind="request" status={request.status} dict={t} />
              <Button
                variant="ghost"
                size="sm"
                onClick={load}
                aria-label={s.checkForUpdates}
                title={s.checkForUpdates}
              >
                <RefreshCcw className="w-4 h-4" />
              </Button>
            </>
          }
        />

        {/* Request summary */}
        <Card radius="panel" padding="none" className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge variant="neutral" label={request.category?.name ?? ''} />
            {request.isUrgent && (
              <StatusBadge variant="warning" label={t.hero.urgent} />
            )}
          </div>
          <p className="text-sm text-ink-sub leading-relaxed">{request.description}</p>

          {Array.isArray(request.photoUrls) && request.photoUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {request.photoUrls.map((u: string) => (
                <a key={u} href={u} target="_blank" rel="noreferrer" className="block w-16 h-16 rounded-input overflow-hidden border border-border-dim">
                  <img src={u} alt="" className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-ink-dim font-medium pt-3 mt-3 border-t border-border-dim">
            <span className="flex items-center gap-1 min-w-0"><MapPin className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{request.address}</span></span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 shrink-0" />{new Date(request.dateWindow).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            {request.budget && <span>{s.budgetLabel} €{request.budget}</span>}
          </div>
        </Card>

        {/* Price range summary */}
        {liveQuotes.length > 1 && minPrice !== null && (
          <Card radius="panel" padding="none" className="p-3.5 flex items-center gap-3">
            <TrendingDown className="w-5 h-5 text-trust shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink">
                {s.priceRangeLabel} <span className="text-trust">€{minPrice.toFixed(0)}</span> – <span className="text-ink-sub">€{maxPrice?.toFixed(0)}</span>
              </p>
              <p className="text-xs text-ink-dim mt-0.5">{s.priceRangeHint}</p>
            </div>
          </Card>
        )}

        {/* Accepted quote — the booking hand-off, not a negotiation control */}
        {acceptedQuote && (
          <Card radius="panel" padding="none" className="p-5 sm:p-6 shadow-elevated">
            <div className="flex items-center gap-2.5 mb-3">
              <CheckCircle2 className="w-5 h-5 text-trust shrink-0" />
              <p className="font-bold text-base text-ink">{s.acceptedTitle}</p>
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <DomainStatusBadge kind="request" status="ACCEPTED" dict={t} />
              <span className="text-sm text-ink-sub truncate">
                {acceptedQuote.provider?.user?.name} · <span className="font-bold text-ink">€{effectivePrice(acceptedQuote).toFixed(2)}</span>
              </span>
            </div>
            <p className="text-xs text-ink-dim mb-5 leading-relaxed">{s.acceptedHint}</p>
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href={acceptedQuote.booking?.id ? `/bookings/${acceptedQuote.booking.id}` : '/bookings'}
                className={cn(buttonVariants({ variant: 'primary', size: 'lg' }), 'flex-1')}
              >
                {s.viewBooking} <ChevronRight className="w-4 h-4" />
              </Link>
              {acceptedQuote.threadId && (
                <Link
                  href={`/messages?thread=${acceptedQuote.threadId}`}
                  className={buttonVariants({ variant: 'secondary', size: 'lg' })}
                >
                  {t.negotiation.viewConversation}
                </Link>
              )}
            </div>
          </Card>
        )}

        {/* Waiting state */}
        {allQuotes.length === 0 && (
          <Card radius="panel" padding="none" bordered={false} className="border border-dashed border-border-dim shadow-none">
            <EmptyState
              icon={MessageSquare}
              size="lg"
              title={
                request.targetProviderId
                  ? `${s.waitingForPrefix} ${targetProviderName ?? t.wizard.chosenProFallback} ${s.waitingForSuffix}`
                  : s.waitingTitle
              }
              description={request.targetProviderId ? s.directWaitingDesc : s.waitingDesc}
              action={
                <div className="flex flex-col items-center gap-3">
                  {request.targetProviderId && (
                    <p className="text-xs text-ink-dim max-w-xs leading-relaxed">
                      {s.notHearingBack}{' '}
                      <Link
                        href={`/requests/new?category=${request.category?.slug ?? ''}`}
                        className="font-semibold text-brand hover:underline"
                      >
                        {s.postOpenRequest}
                      </Link>{' '}
                      {s.toReachAll} {request.category?.name?.toLowerCase() ?? ''} {s.prosSuffix}
                    </p>
                  )}
                  {expiredCount > 0 && (
                    <p className="text-xs text-ink-dim">
                      {expiredCount} {expiredCount > 1 ? s.expiredPlural : s.expiredSingular}
                    </p>
                  )}
                  <Button variant="secondary" size="md" onClick={load}>
                    <RefreshCcw className="w-3.5 h-3.5" /> {s.checkForUpdates}
                  </Button>
                </div>
              }
            />
          </Card>
        )}

        {/* Quote rows — one line per pro, one action: open the conversation */}
        {rows.length > 0 && (
          <section>
            <p className="text-xs font-bold text-ink-dim uppercase tracking-widest mb-2">
              {allQuotes.length} {allQuotes.length > 1 ? s.quotesReceived : s.quoteReceived}
            </p>
            <p className="text-xs text-ink-dim leading-relaxed mb-3">{t.negotiation.inboxHint}</p>

            <Card radius="panel" padding="none" className="divide-y divide-border-dim overflow-hidden">
              {rows.map(quote => (
                <QuoteRow key={quote.id} quote={quote} t={t} />
              ))}
            </Card>
          </section>
        )}
      </div>
    </CustomerLayout>
  );
}

/* One compact row: who, how much right now, where it stands, and the way in.
   Same markup at every width — no hidden sm:/sm:hidden twin to drift. */
function QuoteRow({ quote, t }: { quote: any; t: Dictionary }) {
  const s = t.quoteInbox;
  const p = quote.provider;
  const name = p?.user?.name ?? '';
  const state = quoteState(quote, t);
  const live = quote.status === 'PENDING' && !isExpired(quote);
  const expiry = live ? expiresLabel(quote.expiresAt, s) : null;

  // The conversation is the destination. Without a thread (creation failed
  // server-side on an older deployment) the row still offers the profile
  // rather than dead-ending.
  const href = quote.threadId
    ? `/messages?thread=${quote.threadId}`
    : p?.id ? `/providers/${p.id}` : null;
  const label = quote.threadId ? t.negotiation.openConversation : t.common.profile;

  const body = (
    <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
      <Avatar src={p?.user?.image} name={name} size="md" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-bold text-sm text-ink truncate">{name}</span>
          {p?.isVerified && (
            <ShieldCheck className="w-4 h-4 text-trust shrink-0" aria-label={t.common.verified} />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
          <span className="text-base font-bold text-ink leading-none tabular-nums">
            €{effectivePrice(quote).toFixed(2)}
          </span>
          <StatusBadge variant={state.variant} label={state.label} />
          {expiry && (
            <span className={cn('text-xs', expiresSoon(quote.expiresAt) ? 'text-caution font-semibold' : 'text-ink-dim')}>
              {expiry}
            </span>
          )}
        </div>
      </div>

      {href && (
        <span className="flex items-center gap-1 shrink-0 text-xs font-bold text-brand">
          <span className="hidden sm:inline">{label}</span>
          <ChevronRight className="w-4 h-4" />
        </span>
      )}
    </div>
  );

  if (!href) return body;

  return (
    <Link href={href} aria-label={`${label} — ${name}`} className="block hover:bg-surface-alt transition-colors">
      {body}
    </Link>
  );
}
