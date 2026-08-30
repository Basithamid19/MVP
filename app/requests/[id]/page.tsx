'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import CustomerLayout from '@/components/CustomerLayout';
import { avatarUrl } from '@/lib/avatar';
import {
  ArrowLeft, Star, ShieldCheck, Clock, MapPin,
  CheckCircle2, XCircle, Loader2, MessageSquare,
  AlertCircle, RefreshCcw, ChevronRight, Timer,
  TrendingDown,
} from 'lucide-react';

import { localizedStatus } from '@/lib/status-labels';
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

function etaFromResponse(responseTime: string | undefined, todayLabel: string): string {
  if (!responseTime) return todayLabel;
  if (responseTime.includes('min') || responseTime.includes('hour') || responseTime.includes('hr')) {
    return responseTime;
  }
  return responseTime;
}

export default function QuoteInboxPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslation();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
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
    setActionError(null);
    try {
      const res = await fetch('/api/quotes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId, status }),
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        // Surface the server's reason (availability conflict, request already
        // booked, quote expired…) — this used to be silently discarded.
        setActionError(data.error ?? t.quoteInbox.updateFailed);
        load();
        return;
      }
      if (status === 'ACCEPTED' && data.bookingId) {
        router.push(`/bookings/${data.bookingId}`);
      } else {
        load();
      }
    } catch {
      setActionError(t.common.networkError);
    } finally {
      setActioning(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <Loader2 className="w-8 h-8 animate-spin text-ink-dim" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-canvas text-center p-4">
        <p className="text-xl font-bold mb-2">{t.quoteInbox.notFound}</p>
        <Link href="/dashboard" className="text-brand font-bold hover:underline">{t.common.backToDashboard}</Link>
      </div>
    );
  }

  const status = localizedStatus(t, 'request', request.status);
  const isExpired = (q: any) => q.expiresAt && new Date(q.expiresAt).getTime() < Date.now();
  const pendingQuotes = (request.quotes ?? []).filter((q: any) => q.status === 'PENDING' && !isExpired(q));
  const expiredCount = (request.quotes ?? []).filter((q: any) => q.status === 'PENDING' && isExpired(q)).length;
  const acceptedQuote = (request.quotes ?? []).find((q: any) => q.status === 'ACCEPTED');

  const prices = pendingQuotes.map((q: any) => q.price).filter(Boolean);
  const minPrice = prices.length ? Math.min(...prices) : null;
  const maxPrice = prices.length ? Math.max(...prices) : null;

  return (
    <CustomerLayout maxWidth="max-w-2xl">
      {/* Inline sub-header */}
      <div className="flex items-center gap-2.5 mb-5">
        <button onClick={() => router.back()} className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-surface-alt rounded-full transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-base sm:text-lg leading-tight">{t.quoteInbox.title}</h1>
          <p className="text-xs text-ink-dim">{request.category?.name}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${status.cls}`}>{status.label}</span>
        <button onClick={load} className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-surface-alt rounded-full transition-colors shrink-0">
          <RefreshCcw className="w-4 h-4 text-ink-dim" />
        </button>
      </div>

      <div className="space-y-5">
        {/* Action error (accept/decline failed) */}
        {actionError && (
          <div className="flex items-start justify-between gap-3 px-4 py-3 bg-caution-surface border border-caution-edge rounded-card">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-caution shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-caution leading-relaxed">{actionError}</p>
            </div>
            <button onClick={() => setActionError(null)} className="shrink-0 text-caution hover:opacity-70">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Request summary */}
        <div className="bg-card rounded-card border border-border-dim p-4 sm:p-6 shadow-card">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-1 bg-surface-alt text-ink-sub text-2xs font-bold uppercase tracking-widest rounded-full">
                  {request.category?.name}
                </span>
                {request.isUrgent && (
                  <span className="px-2.5 py-1 bg-caution-surface text-caution text-2xs font-bold uppercase tracking-widest rounded-full flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {t.hero.urgent}
                  </span>
                )}
              </div>
              <p className="text-sm text-ink-sub leading-relaxed">{request.description}</p>
            </div>
          </div>
          {Array.isArray(request.photoUrls) && request.photoUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {request.photoUrls.map((u: string) => (
                <a key={u} href={u} target="_blank" rel="noreferrer" className="block w-16 h-16 rounded-input overflow-hidden border border-border-dim">
                  <img src={u} alt="Request photo" className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-3 text-xs text-ink-dim font-medium pt-3 border-t border-border-dim">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{request.address}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(request.dateWindow).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            {request.budget && <span className="flex items-center gap-1">{t.quoteInbox.budgetLabel} €{request.budget}</span>}
          </div>
        </div>

        {/* Price range summary */}
        {pendingQuotes.length > 1 && minPrice !== null && (
          <div className="bg-card rounded-card border border-border-dim p-3.5 flex items-center gap-3">
            <TrendingDown className="w-5 h-5 text-trust shrink-0" />
            <div>
              <p className="text-sm font-bold text-ink">
                {t.quoteInbox.priceRangeLabel} <span className="text-trust">€{minPrice.toFixed(0)}</span> – <span className="text-ink-sub">€{maxPrice?.toFixed(0)}</span>
              </p>
              <p className="text-xs text-ink-dim mt-0.5">{t.quoteInbox.priceRangeHint}</p>
            </div>
          </div>
        )}

        {/* Accepted quote banner */}
        {acceptedQuote && (
          <div className="bg-brand text-white rounded-card p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-2.5">
              <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
              <span className="font-bold text-sm sm:text-base">{t.quoteInbox.acceptedTitle}</span>
            </div>
            <p className="text-sm text-white/80 mb-1.5">
              {acceptedQuote.provider?.user?.name} · €{acceptedQuote.price?.toFixed(2)}
            </p>
            <p className="text-xs text-white/60 mb-4 leading-relaxed">{t.quoteInbox.acceptedHint}</p>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <Link
                href={acceptedQuote.booking?.id ? `/bookings/${acceptedQuote.booking.id}` : '/bookings'}
                className="flex-1 flex items-center justify-center gap-2 bg-card text-ink px-5 py-3 rounded-card text-sm font-bold hover:bg-surface-alt transition-colors"
              >
                {t.quoteInbox.viewBooking} <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-white/15 text-white px-5 py-3 sm:py-2.5 rounded-card text-sm font-medium hover:bg-white/25 transition-colors"
              >
                {t.nav.dashboard}
              </Link>
            </div>
          </div>
        )}

        {/* Waiting state */}
        {!acceptedQuote && pendingQuotes.length === 0 && (
          <div className="bg-card rounded-card border border-dashed border-border-dim p-7 sm:p-10 text-center">
            <div className="w-14 h-14 bg-surface-alt rounded-card flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-7 h-7 text-ink-dim" />
            </div>
            {request.targetProviderId ? (
              <>
                <p className="font-bold text-base mb-1.5">
                  {t.quoteInbox.waitingForPrefix} {targetProviderName ?? t.wizard.chosenProFallback} {t.quoteInbox.waitingForSuffix}
                </p>
                <p className="text-sm text-ink-sub leading-relaxed max-w-xs mx-auto">
                  {t.quoteInbox.directWaitingDesc}
                </p>
                <p className="text-xs text-ink-dim mt-3 max-w-xs mx-auto">
                  {t.quoteInbox.notHearingBack}{' '}
                  <Link
                    href={`/requests/new?category=${request.category?.slug ?? ''}`}
                    className="font-semibold text-brand hover:underline"
                  >
                    {t.quoteInbox.postOpenRequest}
                  </Link>{' '}
                  {t.quoteInbox.toReachAll} {request.category?.name?.toLowerCase() ?? ''} {t.quoteInbox.prosSuffix}
                </p>
              </>
            ) : (
              <>
                <p className="font-bold text-base mb-1.5">{t.quoteInbox.waitingTitle}</p>
                <p className="text-sm text-ink-sub leading-relaxed max-w-xs mx-auto">{t.quoteInbox.waitingDesc}</p>
              </>
            )}
            {expiredCount > 0 && (
              <p className="text-xs text-ink-dim mt-3">
                {expiredCount} {expiredCount > 1 ? t.quoteInbox.expiredPlural : t.quoteInbox.expiredSingular}
              </p>
            )}
            <button onClick={load} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-ink-sub hover:text-ink border border-border-dim rounded-input px-4 py-2.5 transition-colors">
              <RefreshCcw className="w-3.5 h-3.5" /> {t.quoteInbox.checkForUpdates}
            </button>
          </div>
        )}

        {/* Quotes list */}
        {!acceptedQuote && pendingQuotes.length > 0 && (
          <div>
            <p className="text-xs font-bold text-ink-dim uppercase tracking-widest mb-3">{pendingQuotes.length} {pendingQuotes.length > 1 ? t.quoteInbox.quotesReceived : t.quoteInbox.quoteReceived}</p>
            <div className="space-y-4">
              {pendingQuotes
                .slice()
                .sort((a: any, b: any) => (b.provider?.ratingAvg ?? 0) - (a.provider?.ratingAvg ?? 0))
                .map((quote: any, i: number) => {
                  const p = quote.provider;
                  const eta = etaFromResponse(p?.responseTime, t.quoteInbox.today);
                  return (
                    <div key={quote.id} className={`bg-card rounded-card border p-4 sm:p-6 shadow-card ${i === 0 ? 'border-brand' : 'border-border-dim'}`}>
                      {i === 0 && (
                        <div className="flex items-center gap-1.5 mb-3">
                          <Star className="w-3.5 h-3.5 text-brand fill-current" />
                          <span className="text-2xs font-bold text-brand uppercase tracking-widest">{t.quoteInbox.bestMatch}</span>
                        </div>
                      )}
                      <div className="flex items-start gap-4 mb-4">
                        <img
                          src={p?.user?.image || avatarUrl(p?.user?.name, 150)}
                          alt={p?.user?.name}
                          className="w-12 h-12 rounded-card object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="font-bold">{p?.user?.name}</span>
                            {p?.isVerified && (
                              <span className="flex items-center gap-1 bg-trust-surface text-trust px-2 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wide">
                                <ShieldCheck className="w-3 h-3" /> {t.common.verified}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-ink-dim">
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-brand fill-current" />
                              <span className="font-bold text-ink">{p?.ratingAvg?.toFixed(1)}</span>
                            </span>
                            <span>{p?.completedJobs} {t.meetPros.jobs}</span>
                            <span className="flex items-center gap-1 text-trust font-bold">
                              <Timer className="w-3 h-3" /> {t.quoteInbox.etaLabel} {eta}
                            </span>
                          </div>
                          <p className="text-xs text-ink-dim mt-1 truncate">{p?.categories?.map((c: any) => c.name).join(', ')}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xl font-bold">€{quote.price?.toFixed(2)}</p>
                          {quote.estimatedHours && (
                            <p className="text-xs text-ink-dim mt-0.5">~{quote.estimatedHours}h</p>
                          )}
                          {expiresLabel(quote.expiresAt, t.quoteInbox) && (
                            <p className="text-2xs text-caution mt-0.5">{expiresLabel(quote.expiresAt, t.quoteInbox)}</p>
                          )}
                          {minPrice !== null && maxPrice !== null && maxPrice > minPrice && (
                            <p className="text-2xs text-ink-dim mt-0.5">
                              {quote.price === minPrice ? (
                                <span className="text-trust font-bold">{t.quoteInbox.lowest}</span>
                              ) : quote.price === maxPrice ? (
                                <span className="text-ink-sub">{t.quoteInbox.highest}</span>
                              ) : (
                                <span className="text-ink-dim">{t.quoteInbox.midRange}</span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      {quote.notes && (
                        <div className="p-3 bg-surface-alt rounded-input border border-border-dim mb-4">
                          <p className="text-sm text-ink-sub italic">&quot;{quote.notes}&quot;</p>
                        </div>
                      )}
                      <div className="space-y-2 sm:space-y-0 sm:flex sm:gap-2">
                        <button
                          onClick={() => setConfirmAcceptId(quote.id)}
                          disabled={actioning === quote.id}
                          className="w-full flex items-center justify-center gap-2 bg-brand text-white py-3 rounded-card font-bold text-sm hover:bg-brand-dark transition-all disabled:opacity-50"
                        >
                          {actioning === quote.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> {t.quoteInbox.acceptQuote}</>}
                        </button>
                        <div className="flex gap-2">
                          <Link
                            href={`/providers/${p?.id}`}
                            className="flex-1 sm:flex-initial flex items-center justify-center px-4 py-3 border border-border-dim rounded-card font-bold text-sm text-ink hover:bg-surface-alt transition-colors"
                          >
                            {t.common.profile}
                          </Link>
                          {/* Chat entry removed: messaging unlocks only after
                              the booking deposit is paid. */}
                          <button
                            onClick={() => handleQuote(quote.id, 'DECLINED')}
                            disabled={!!actioning}
                            className="p-3 border border-border-dim rounded-card text-ink-dim hover:border-danger-edge hover:text-danger transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Accept confirmation — accepting is one-shot and auto-declines the
          other quotes, so make that explicit before committing. */}
      {confirmAcceptId && (() => {
        const q = pendingQuotes.find((x: any) => x.id === confirmAcceptId);
        const othersCount = pendingQuotes.length - 1;
        return (
          <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-card rounded-panel p-6 w-full max-w-sm">
              <h2 className="font-bold text-lg mb-2">{t.quoteInbox.confirmTitle}</h2>
              <p className="text-sm text-ink-sub mb-1.5">
                {q?.provider?.user?.name} · <span className="font-bold text-ink">€{q?.price?.toFixed(2)}</span>
              </p>
              <p className="text-sm text-ink-sub mb-6">
                {t.quoteInbox.confirmDeposit}
                {othersCount > 0 && ` ${t.quoteInbox.othersPrefix} ${othersCount} ${othersCount > 1 ? t.quoteInbox.othersDeclinedPlural : t.quoteInbox.otherDeclinedSingular}`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmAcceptId(null)}
                  className="flex-1 py-3 border border-border rounded-input text-sm font-bold text-ink-sub hover:border-border-dim"
                >
                  {t.common.back}
                </button>
                <button
                  onClick={() => { const id = confirmAcceptId; setConfirmAcceptId(null); handleQuote(id, 'ACCEPTED'); }}
                  className="flex-1 bg-brand text-white py-3 rounded-input text-sm font-bold hover:bg-brand-dark flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> {t.quoteInbox.accept}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </CustomerLayout>
  );
}
