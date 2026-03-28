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

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  NEW:      { label: 'Waiting for quotes', color: 'bg-info-surface text-info' },
  CHATTING: { label: 'In discussion',      color: 'bg-brand-muted text-brand-dark' },
  QUOTED:   { label: 'Quotes received',    color: 'bg-trust-surface text-trust' },
  ACCEPTED: { label: 'Accepted',           color: 'bg-brand text-white' },
  DECLINED: { label: 'Declined',           color: 'bg-danger-surface text-danger' },
  EXPIRED:  { label: 'Expired',            color: 'bg-surface-alt text-ink-sub' },
};

function etaFromResponse(responseTime: string | undefined): string {
  if (!responseTime) return 'Today';
  if (responseTime.includes('min') || responseTime.includes('hour') || responseTime.includes('hr')) {
    return responseTime;
  }
  return responseTime;
}

export default function QuoteInboxPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/requests?id=${id}`)
      .then(r => r.json())
      .then(d => { setRequest(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleQuote = async (quoteId: string, status: 'ACCEPTED' | 'DECLINED') => {
    setActioning(quoteId);
    try {
      const res = await fetch('/api/quotes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId, status }),
      });
      const data = await res.json();
      if (status === 'ACCEPTED' && data.bookingId) {
        router.push(`/bookings/${data.bookingId}`);
      } else {
        load();
      }
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
        <p className="text-xl font-bold mb-2">Request not found</p>
        <Link href="/dashboard" className="text-brand font-bold hover:underline">Back to dashboard</Link>
      </div>
    );
  }

  const status = STATUS_LABELS[request.status] ?? { label: request.status, color: 'bg-surface-alt text-ink-sub' };
  const pendingQuotes = (request.quotes ?? []).filter((q: any) => q.status === 'PENDING');
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
          <h1 className="font-bold text-base sm:text-lg leading-tight">Quote Inbox</h1>
          <p className="text-xs text-ink-dim">{request.category?.name}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${status.color}`}>{status.label}</span>
        <button onClick={load} className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-surface-alt rounded-full transition-colors shrink-0">
          <RefreshCcw className="w-4 h-4 text-ink-dim" />
        </button>
      </div>

      <div className="space-y-5">
        {/* Request summary */}
        <div className="bg-white rounded-2xl border border-border-dim p-4 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-1 bg-surface-alt text-ink-sub text-[11px] font-bold uppercase tracking-widest rounded-full">
                  {request.category?.name}
                </span>
                {request.isUrgent && (
                  <span className="px-2.5 py-1 bg-caution-surface text-caution text-[11px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Urgent
                  </span>
                )}
              </div>
              <p className="text-sm text-ink-sub leading-relaxed">{request.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-ink-dim font-medium pt-3 border-t border-border-dim">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{request.address}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(request.dateWindow).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            {request.budget && <span className="flex items-center gap-1">Budget: €{request.budget}</span>}
          </div>
        </div>

        {/* Price range summary */}
        {pendingQuotes.length > 1 && minPrice !== null && (
          <div className="bg-white rounded-2xl border border-border-dim p-3.5 flex items-center gap-3">
            <TrendingDown className="w-5 h-5 text-trust shrink-0" />
            <div>
              <p className="text-sm font-bold text-ink">
                Price range: <span className="text-trust">€{minPrice.toFixed(0)}</span> – <span className="text-ink-sub">€{maxPrice?.toFixed(0)}</span>
              </p>
              <p className="text-xs text-ink-dim mt-0.5">Pick the quote that fits your budget — all pros are verified.</p>
            </div>
          </div>
        )}

        {/* Accepted quote banner */}
        {acceptedQuote && (
          <div className="bg-brand text-white rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-2.5">
              <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
              <span className="font-bold text-sm sm:text-base">Quote accepted — booking confirmed!</span>
            </div>
            <p className="text-sm text-white/80 mb-1.5">
              {acceptedQuote.provider?.user?.name} · €{acceptedQuote.price?.toFixed(2)}
            </p>
            <p className="text-xs text-white/60 mb-4 leading-relaxed">Your pro will be in touch to confirm the details.</p>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <Link
                href={`/bookings/${acceptedQuote.bookingId || ''}`}
                className="flex-1 flex items-center justify-center gap-2 bg-white text-ink px-5 py-3 rounded-2xl text-sm font-bold hover:bg-surface-alt transition-colors"
              >
                View Booking <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-white/15 text-white px-5 py-3 sm:py-2.5 rounded-2xl text-sm font-medium hover:bg-white/25 transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Waiting state */}
        {!acceptedQuote && pendingQuotes.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-border-dim p-7 sm:p-10 text-center">
            <div className="w-14 h-14 bg-surface-alt rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-7 h-7 text-ink-dim" />
            </div>
            <p className="font-bold text-base mb-1.5">Waiting for quotes</p>
            <p className="text-sm text-ink-sub leading-relaxed max-w-xs mx-auto">Verified pros are reviewing your request. Most respond within 1 hour.</p>
            <button onClick={load} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-ink-sub hover:text-ink border border-border-dim rounded-xl px-4 py-2.5 transition-colors">
              <RefreshCcw className="w-3.5 h-3.5" /> Check for updates
            </button>
          </div>
        )}

        {/* Quotes list */}
        {!acceptedQuote && pendingQuotes.length > 0 && (
          <div>
            <p className="text-xs font-bold text-ink-dim uppercase tracking-widest mb-3">{pendingQuotes.length} quote{pendingQuotes.length > 1 ? 's' : ''} received</p>
            <div className="space-y-4">
              {pendingQuotes
                .slice()
                .sort((a: any, b: any) => (b.provider?.ratingAvg ?? 0) - (a.provider?.ratingAvg ?? 0))
                .map((quote: any, i: number) => {
                  const p = quote.provider;
                  const eta = etaFromResponse(p?.responseTime);
                  return (
                    <div key={quote.id} className={`bg-white rounded-2xl border p-4 sm:p-6 shadow-sm ${i === 0 ? 'border-brand' : 'border-border-dim'}`}>
                      {i === 0 && (
                        <div className="flex items-center gap-1.5 mb-3">
                          <Star className="w-3.5 h-3.5 text-brand fill-current" />
                          <span className="text-[11px] font-bold text-brand uppercase tracking-widest">Best match</span>
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
                              <span className="flex items-center gap-1 bg-trust-surface text-trust px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide">
                                <ShieldCheck className="w-3 h-3" /> Verified
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-ink-dim">
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-brand fill-current" />
                              <span className="font-bold text-ink">{p?.ratingAvg?.toFixed(1)}</span>
                            </span>
                            <span>{p?.completedJobs} jobs</span>
                            <span className="flex items-center gap-1 text-trust font-bold">
                              <Timer className="w-3 h-3" /> ETA: {eta}
                            </span>
                          </div>
                          <p className="text-xs text-ink-dim mt-1 truncate">{p?.categories?.map((c: any) => c.name).join(', ')}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xl font-bold">€{quote.price?.toFixed(2)}</p>
                          {quote.estimatedHours && (
                            <p className="text-xs text-ink-dim mt-0.5">~{quote.estimatedHours}h</p>
                          )}
                          {minPrice !== null && maxPrice !== null && maxPrice > minPrice && (
                            <p className="text-[11px] text-ink-dim mt-0.5">
                              {quote.price === minPrice ? (
                                <span className="text-trust font-bold">Lowest</span>
                              ) : quote.price === maxPrice ? (
                                <span className="text-ink-sub">Highest</span>
                              ) : (
                                <span className="text-ink-dim">Mid range</span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      {quote.notes && (
                        <div className="p-3 bg-surface-alt rounded-xl border border-border-dim mb-4">
                          <p className="text-sm text-ink-sub italic">&quot;{quote.notes}&quot;</p>
                        </div>
                      )}
                      <div className="space-y-2 sm:space-y-0 sm:flex sm:gap-2">
                        <button
                          onClick={() => handleQuote(quote.id, 'ACCEPTED')}
                          disabled={actioning === quote.id}
                          className="w-full flex items-center justify-center gap-2 bg-brand text-white py-3 rounded-2xl font-bold text-sm hover:bg-brand-dark transition-all disabled:opacity-50"
                        >
                          {actioning === quote.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Accept Quote</>}
                        </button>
                        <div className="flex gap-2">
                          <Link
                            href={`/providers/${p?.id}`}
                            className="flex-1 sm:flex-initial flex items-center justify-center px-4 py-3 border border-border-dim rounded-2xl font-bold text-sm text-ink hover:bg-surface-alt transition-colors"
                          >
                            Profile
                          </Link>
                          <button
                            title="Message pro"
                            className="p-3 border border-border-dim rounded-2xl text-ink-dim hover:border-brand hover:text-ink transition-colors"
                          >
                            <MessageSquare className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleQuote(quote.id, 'DECLINED')}
                            disabled={!!actioning}
                            className="p-3 border border-border-dim rounded-2xl text-ink-dim hover:border-danger-edge hover:text-danger transition-colors disabled:opacity-50"
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
    </CustomerLayout>
  );
}
