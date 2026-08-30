'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import CustomerLayout from '@/components/CustomerLayout';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, ShieldCheck, Clock, MapPin,
  CheckCircle2, X, MessageSquare, SearchX,
  RefreshCcw, ChevronRight, TrendingDown,
} from 'lucide-react';

import {
  Alert, Avatar, Button, buttonVariants, Card, DomainStatusBadge, EmptyState,
  Modal, ModalFooter, PageHeader, Skeleton, StatusBadge,
} from '@/components/ui';
import { useTranslation } from '@/lib/i18n';
import type { Dictionary } from '@/lib/i18n/types';

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

/* Provider `responseTime` is free text and historically arrived as a whole
 * sentence ("Usually responds in 1 hour"), which blew out the quote card's
 * metadata line. Reduce it to a short, chip-sized form. */
const ETA_LEAD_IN = /^(?:usually\s+)?respond(?:s|ing)?\s+(?:in|within)\s+/i;
const ETA_VALUE   = /^(?:~|about\s+|approx\.?\s+|under\s+|less\s+than\s+)?(\d+)\s*(min(?:ute)?s?|h(?:ou)?rs?|d(?:ay)?s?)\b/i;
const ETA_MAX_LEN = 16;

export function etaFromResponse(
  responseTime: string | undefined,
  s: Dictionary['quoteInbox'],
): string {
  const raw = (responseTime ?? '').trim();
  if (!raw) return s.today;

  const stripped = raw.replace(ETA_LEAD_IN, '').trim();
  if (!stripped) return s.today;

  const m = stripped.match(ETA_VALUE);
  if (m) {
    const unit = m[2].toLowerCase();
    const suffix =
      unit.startsWith('min') ? s.minutesShort :
      unit.startsWith('h')   ? s.hoursShort   :
                               s.daysShort;
    return `~${m[1]}${suffix}`;
  }

  return stripped.length > ETA_MAX_LEN
    ? `${stripped.slice(0, ETA_MAX_LEN - 1).trimEnd()}…`
    : stripped;
}

export default function QuoteInboxPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslation();
  const s = t.quoteInbox;
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  // Availability / conflict errors belong on the quote they came from, not
  // in a page-wide banner — the customer needs to know *which* pro is busy.
  const [quoteError, setQuoteError] = useState<{ quoteId: string; message: string } | null>(null);
  const [confirmAcceptId, setConfirmAcceptId] = useState<string | null>(null);
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

  const handleQuote = async (quoteId: string, status: 'ACCEPTED' | 'DECLINED') => {
    setActioning(quoteId);
    setQuoteError(null);
    try {
      const res = await fetch('/api/quotes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId, status }),
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        // Prefer the machine-readable code so the reason is localized; the
        // server's `error` string is English and only a last resort.
        const byCode: Record<string, string> = {
          blackout_date:   s.errBlackout,
          day_unavailable: s.errDayUnavailable,
          outside_hours:   s.errOutsideHours,
          time_conflict:   s.errTimeConflict,
        };
        const message = byCode[data.errorCode] ?? data.error ?? s.updateFailed;
        setQuoteError({ quoteId, message });
        load();
        return;
      }
      if (status === 'ACCEPTED' && data.bookingId) {
        router.push(`/bookings/${data.bookingId}`);
      } else {
        load();
      }
    } catch {
      setQuoteError({ quoteId, message: t.common.networkError });
    } finally {
      setActioning(null);
    }
  };

  if (loading) {
    return (
      <CustomerLayout maxWidth="max-w-2xl">
        <div className="space-y-5">
          <Skeleton rounded="chip" className="h-8 w-44" />
          <Skeleton rounded="panel" className="h-36 w-full" />
          <Skeleton rounded="panel" className="h-52 w-full" />
          <Skeleton rounded="panel" className="h-52 w-full" />
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

  const isExpired = (q: any) => q.expiresAt && new Date(q.expiresAt).getTime() < Date.now();
  const pendingQuotes = (request.quotes ?? []).filter((q: any) => q.status === 'PENDING' && !isExpired(q));
  const expiredCount = (request.quotes ?? []).filter((q: any) => q.status === 'PENDING' && isExpired(q)).length;
  const acceptedQuote = (request.quotes ?? []).find((q: any) => q.status === 'ACCEPTED');

  const prices = pendingQuotes.map((q: any) => q.price).filter(Boolean);
  const minPrice = prices.length ? Math.min(...prices) : null;
  const maxPrice = prices.length ? Math.max(...prices) : null;
  const hasPriceSpread = minPrice !== null && maxPrice !== null && maxPrice > minPrice;

  const ranked = pendingQuotes
    .slice()
    .sort((a: any, b: any) => (b.provider?.ratingAvg ?? 0) - (a.provider?.ratingAvg ?? 0));

  /* ONE ranking claim per card. "Best match" is only earned by a quote that is
   * unambiguously the highest rated *and* isn't the most expensive one — the
   * old version put "Best match" and "Highest" on the same card. */
  const topRating = ranked[0]?.provider?.ratingAvg ?? 0;
  const runnerUpRating = ranked[1]?.provider?.ratingAvg ?? 0;
  const bestMatchId =
    ranked.length > 1 && topRating > 0 && topRating > runnerUpRating &&
    !(hasPriceSpread && ranked[0].price === maxPrice)
      ? ranked[0].id
      : null;

  const confirmQuote = pendingQuotes.find((x: any) => x.id === confirmAcceptId);
  const othersCount = pendingQuotes.length - 1;

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
        {pendingQuotes.length > 1 && minPrice !== null && (
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

        {/* Accepted quote */}
        {acceptedQuote && (
          <Card radius="panel" padding="none" className="p-5 sm:p-6 shadow-elevated">
            <div className="flex items-center gap-2.5 mb-3">
              <CheckCircle2 className="w-5 h-5 text-trust shrink-0" />
              <p className="font-bold text-base text-ink">{s.acceptedTitle}</p>
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <DomainStatusBadge kind="request" status="ACCEPTED" dict={t} />
              <span className="text-sm text-ink-sub truncate">
                {acceptedQuote.provider?.user?.name} · <span className="font-bold text-ink">€{acceptedQuote.price?.toFixed(2)}</span>
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
              <Link href="/dashboard" className={buttonVariants({ variant: 'secondary', size: 'lg' })}>
                {t.nav.dashboard}
              </Link>
            </div>
          </Card>
        )}

        {/* Waiting state */}
        {!acceptedQuote && pendingQuotes.length === 0 && (
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

        {/* Quotes list */}
        {!acceptedQuote && pendingQuotes.length > 0 && (
          <section>
            <p className="text-xs font-bold text-ink-dim uppercase tracking-widest mb-3">
              {pendingQuotes.length} {pendingQuotes.length > 1 ? s.quotesReceived : s.quoteReceived}
            </p>
            <div className="space-y-4">
              {ranked.map((quote: any) => {
                const p = quote.provider;
                const name = p?.user?.name ?? '';
                const eta = etaFromResponse(p?.responseTime, s);
                const isBestMatch = quote.id === bestMatchId;
                const expiry = expiresLabel(quote.expiresAt, s);
                const rank = !hasPriceSpread
                  ? null
                  : quote.price === minPrice ? s.lowest
                  : quote.price === maxPrice ? s.highest
                  : s.midRange;
                const categories = (p?.categories ?? []).map((c: any) => c.name).filter(Boolean);
                const busy = actioning === quote.id;

                /* One truncating meta line — the old three-cell flex row had no
                 * wrap and no min-w-0, so the ETA sentence ran under the price
                 * column and got clipped. */
                const meta = [
                  p?.ratingAvg != null ? `★ ${p.ratingAvg.toFixed(1)}` : null,
                  p?.completedJobs != null ? `${p.completedJobs} ${t.meetPros.jobs}` : null,
                  eta,
                ].filter(Boolean).join(' · ');

                return (
                  <Card
                    key={quote.id}
                    radius="panel"
                    padding="none"
                    className={cn('p-4 sm:p-5', isBestMatch && 'border-brand/40')}
                  >
                    {isBestMatch && (
                      <div className="mb-3">
                        <StatusBadge variant="brand" label={s.bestMatch} />
                      </div>
                    )}

                    {/* Identity */}
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar src={p?.user?.image} name={name} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-bold text-sm text-ink truncate">{name}</span>
                          {p?.isVerified && (
                            <ShieldCheck
                              className="w-4 h-4 text-trust shrink-0"
                              aria-label={t.common.verified}
                            />
                          )}
                        </div>
                        <p
                          className="text-xs text-ink-sub truncate mt-0.5"
                          title={`${meta} · ${s.etaLabel} ${eta}`}
                        >
                          {meta}
                        </p>
                      </div>
                    </div>

                    {/* Price strip — the hero figure, with its meta grouped
                        beside it instead of a ragged right gutter. */}
                    <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 bg-surface-alt border border-border-dim rounded-card px-3.5 py-3">
                      <span className="text-2xl font-bold text-ink leading-none">
                        €{quote.price?.toFixed(2)}
                      </span>
                      {quote.estimatedHours && (
                        <span className="text-xs text-ink-sub">~{quote.estimatedHours}{s.hoursShort}</span>
                      )}
                      {expiry && (
                        <span className={cn('text-xs', expiresSoon(quote.expiresAt) ? 'text-caution font-semibold' : 'text-ink-dim')}>
                          {expiry}
                        </span>
                      )}
                      {rank && (
                        <StatusBadge variant="neutral" label={rank} className="ml-auto" />
                      )}
                    </div>

                    {categories.length > 0 && (
                      <p className="text-xs text-ink-dim truncate mt-2.5">{categories.join(', ')}</p>
                    )}

                    {quote.notes && (
                      <p className="mt-3 pl-3 border-l-2 border-border-dim text-sm text-ink-sub italic leading-relaxed">
                        {quote.notes}
                      </p>
                    )}

                    {quoteError?.quoteId === quote.id && (
                      <Alert
                        variant="caution"
                        className="mt-3"
                        onDismiss={() => setQuoteError(null)}
                      >
                        {quoteError.message}
                      </Alert>
                    )}

                    {/* One action row at every width. */}
                    <div className="mt-4 flex items-center gap-2">
                      <Button
                        size="lg"
                        className="flex-1"
                        loading={busy}
                        disabled={!!actioning}
                        onClick={() => setConfirmAcceptId(quote.id)}
                      >
                        {!busy && <CheckCircle2 className="w-4 h-4" />} {s.acceptQuote}
                      </Button>
                      <Link
                        href={`/providers/${p?.id}`}
                        className={buttonVariants({ variant: 'secondary', size: 'lg' })}
                      >
                        {t.common.profile}
                      </Link>
                      <Button
                        variant="ghost"
                        size="lg"
                        aria-label={s.dismissQuote}
                        title={s.dismissQuote}
                        disabled={!!actioning}
                        onClick={() => handleQuote(quote.id, 'DECLINED')}
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Accepting is one-shot and auto-declines the other quotes, so make
          that explicit before committing. */}
      <Modal
        open={!!confirmAcceptId}
        onClose={() => setConfirmAcceptId(null)}
        size="sm"
        title={s.confirmTitle}
        footer={
          <ModalFooter>
            <Button variant="secondary" size="lg" onClick={() => setConfirmAcceptId(null)}>
              {t.common.back}
            </Button>
            <Button
              size="lg"
              onClick={() => {
                const target = confirmAcceptId;
                setConfirmAcceptId(null);
                if (target) handleQuote(target, 'ACCEPTED');
              }}
            >
              <CheckCircle2 className="w-4 h-4" /> {s.accept}
            </Button>
          </ModalFooter>
        }
      >
        <p className="text-sm text-ink-sub mb-1.5">
          {confirmQuote?.provider?.user?.name} · <span className="font-bold text-ink">€{confirmQuote?.price?.toFixed(2)}</span>
        </p>
        <p className="text-sm text-ink-sub leading-relaxed">
          {s.confirmDeposit}
          {othersCount > 0 && ` ${s.othersPrefix} ${othersCount} ${othersCount > 1 ? s.othersDeclinedPlural : s.otherDeclinedSingular}`}
        </p>
      </Modal>
    </CustomerLayout>
  );
}
