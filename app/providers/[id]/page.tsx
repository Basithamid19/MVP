'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Star,
  ShieldCheck,
  MapPin,
  MessageSquare,
  Clock,
  Languages,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Award,
  ThumbsUp,
  Calendar,
  Sun,
  Moon,
  Sunrise,
} from 'lucide-react';
import Link from 'next/link';
import CustomerLayout from '@/components/CustomerLayout';
import { avatarUrl } from '@/lib/avatar';

const AVAILABILITY: Record<string, { slots: string[]; label: string }> = {
  Mon: { slots: ['morning', 'afternoon'],           label: 'Mon' },
  Tue: { slots: ['morning', 'afternoon', 'evening'], label: 'Tue' },
  Wed: { slots: ['afternoon', 'evening'],            label: 'Wed' },
  Thu: { slots: ['morning', 'afternoon'],            label: 'Thu' },
  Fri: { slots: ['morning', 'afternoon', 'evening'], label: 'Fri' },
  Sat: { slots: ['morning'],                         label: 'Sat' },
  Sun: { slots: [],                                  label: 'Sun' },
};

const SLOT_ICONS: Record<string, React.ElementType> = {
  morning:   Sunrise,
  afternoon: Sun,
  evening:   Moon,
};

export default function ProviderProfilePage() {
  const { id }   = useParams();
  const router   = useRouter();
  const { data: session } = useSession();
  const [provider, setProvider] = useState<any>(null);
  const [reviews,  setReviews]  = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const fetchProvider = async () => {
      try {
        const [provRes, revRes] = await Promise.all([
          fetch(`/api/providers?id=${id}`),
          fetch(`/api/reviews?providerId=${id}`).catch(() => null),
        ]);
        const provData = await provRes.json();
        setProvider(provData?.id ? provData : null);
        if (revRes?.ok) {
          const revData = await revRes.json();
          if (Array.isArray(revData)) setReviews(revData);
        }
      } catch (error) {
        console.error('Failed to fetch provider', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProvider();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <Loader2 className="w-8 h-8 animate-spin text-ink-dim" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-canvas p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Provider not found</h1>
        <Link href="/browse" className="text-brand font-bold hover:underline">Back to browse</Link>
      </div>
    );
  }

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }));
  const maxCount = Math.max(...ratingDistribution.map(r => r.count), 1);

  const qualityIndicators = [
    { label: 'Jobs completed', value: `${provider.completedJobs}+`,           icon: CheckCircle2, positive: true },
    { label: 'Response time',  value: provider.responseTime,                   icon: Clock,        positive: true },
    { label: 'Rating',         value: `${provider.ratingAvg.toFixed(1)} / 5`, icon: Star,         positive: true },
    { label: 'ID Verified',    value: provider.isVerified ? 'Yes' : 'No',     icon: ShieldCheck,  positive: provider.isVerified },
  ];

  return (
    <CustomerLayout maxWidth="max-w-5xl">
      {/* Sub-header */}
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <button
          onClick={() => router.back()}
          className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-surface-alt rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-base sm:text-lg flex-1">Professional Profile</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">

        {/* ── Left Column ── */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">

          {/* Profile hero card */}
          <div className="bg-white p-4 sm:p-8 rounded-panel border border-border-dim shadow-sm">

            {/* Avatar + identity row — always side-by-side */}
            <div className="flex gap-4 sm:gap-8 items-start">
              <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-2xl sm:rounded-panel overflow-hidden shrink-0 bg-surface-alt border border-border-dim">
                <img
                  src={provider.user.image || avatarUrl(provider.user.name, 300)}
                  alt={provider.user.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                {/* Name + verified badge */}
                <div className="flex items-start gap-2 flex-wrap mb-1.5">
                  <h2 className="text-xl sm:text-3xl md:text-4xl font-bold tracking-tight text-ink leading-tight">
                    {provider.user.name}
                  </h2>
                  {provider.isVerified && (
                    <div className="flex items-center gap-1 bg-trust-surface text-trust px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide mt-0.5 sm:mt-1.5 shrink-0">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </div>
                  )}
                </div>

                {/* Rating + location */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:gap-4 mb-2 sm:mb-4">
                  <div className="flex items-center gap-1 text-brand">
                    <Star className="w-3.5 h-3.5 sm:w-5 sm:h-5 fill-current" />
                    <span className="text-ink font-bold text-sm sm:text-base">{provider.ratingAvg.toFixed(1)}</span>
                    <span className="text-ink-dim text-[11px] sm:text-sm font-medium ml-0.5">
                      ({reviews.length || provider.completedJobs} reviews)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-ink-dim text-[11px] sm:text-sm font-medium">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                    {provider.serviceArea}
                  </div>
                </div>

                {/* Bio — desktop only (shown inline) */}
                <p className="hidden sm:block text-ink-sub leading-relaxed mb-5">
                  {provider.bio && provider.bio.trim().length > 0
                    ? provider.bio
                    : `${provider.categories?.map((c: any) => c.name).join(', ') || 'Professional'}${provider.serviceArea ? ` in ${provider.serviceArea}` : ''}`
                  }
                </p>

                {/* Stat tiles — desktop only */}
                <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-surface-alt rounded-card border border-border-dim">
                    <div className="flex items-center gap-1.5 text-ink-dim text-[11px] font-bold uppercase tracking-widest mb-1">
                      <Clock className="w-3 h-3" /> Response
                    </div>
                    <div className="text-sm font-bold">{provider.responseTime}</div>
                  </div>
                  <div className="p-3 bg-surface-alt rounded-card border border-border-dim">
                    <div className="flex items-center gap-1.5 text-ink-dim text-[11px] font-bold uppercase tracking-widest mb-1">
                      <Languages className="w-3 h-3" /> Languages
                    </div>
                    <div className="text-sm font-bold">{provider.languages.join(', ')}</div>
                  </div>
                  <div className="p-3 bg-surface-alt rounded-card border border-border-dim">
                    <div className="flex items-center gap-1.5 text-ink-dim text-[11px] font-bold uppercase tracking-widest mb-1">
                      <CheckCircle2 className="w-3 h-3" /> Jobs done
                    </div>
                    <div className="text-sm font-bold">{provider.completedJobs}+</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile only: bio + compact stat tiles below the row */}
            <p className="sm:hidden text-sm text-ink-sub leading-relaxed mt-3.5 mb-4">
              {provider.bio && provider.bio.trim().length > 0
                ? provider.bio
                : `${provider.categories?.map((c: any) => c.name).join(', ') || 'Professional'}${provider.serviceArea ? ` in ${provider.serviceArea}` : ''}`
              }
            </p>
            <div className="sm:hidden grid grid-cols-3 gap-2">
              <div className="p-3 bg-surface-alt rounded-2xl text-center">
                <p className="text-[10px] font-bold text-ink-dim uppercase tracking-wide mb-1 flex items-center justify-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" /> Responds
                </p>
                <p className="text-[11px] font-bold text-ink leading-tight">{provider.responseTime}</p>
              </div>
              <div className="p-3 bg-surface-alt rounded-2xl text-center">
                <p className="text-[10px] font-bold text-ink-dim uppercase tracking-wide mb-1 flex items-center justify-center gap-0.5">
                  <Languages className="w-2.5 h-2.5" /> Speaks
                </p>
                <p className="text-[11px] font-bold text-ink leading-tight truncate">{provider.languages[0]}</p>
              </div>
              <div className="p-3 bg-surface-alt rounded-2xl text-center">
                <p className="text-[10px] font-bold text-ink-dim uppercase tracking-wide mb-1 flex items-center justify-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Jobs
                </p>
                <p className="text-[11px] font-bold text-ink leading-tight">{provider.completedJobs}+</p>
              </div>
            </div>
          </div>

          {/* Quality indicators */}
          <div className="bg-white p-4 sm:p-6 rounded-panel border border-border-dim shadow-sm">
            <div className="flex items-center gap-2 mb-4 sm:mb-5">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-brand" />
              <h3 className="text-base sm:text-lg font-bold">Quality Indicators</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {qualityIndicators.map((qi, i) => (
                <div key={i} className={`p-3 sm:p-4 rounded-2xl border text-center ${
                  qi.positive ? 'bg-trust-surface border-trust-edge' : 'bg-surface-alt border-border-dim'
                }`}>
                  <qi.icon className={`w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1.5 sm:mb-2 ${qi.positive ? 'text-trust' : 'text-ink-dim'}`} />
                  <p className="font-bold text-sm">{qi.value}</p>
                  <p className="text-[10px] sm:text-[11px] text-ink-dim mt-0.5">{qi.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Services */}
          <div className="bg-white p-4 sm:p-6 rounded-panel border border-border-dim shadow-sm">
            <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-5">Services</h3>
            <div className="space-y-2.5 sm:space-y-3">
              {provider.categories.map((cat: any) => {
                const offering = provider.offerings?.find((o: any) => o.categoryId === cat.id);
                return (
                  <div key={cat.id} className="flex items-center justify-between p-3 sm:p-4 bg-surface-alt rounded-2xl border border-border-dim">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-xl sm:rounded-input flex items-center justify-center shadow-sm">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-trust" />
                      </div>
                      <span className="font-bold text-sm sm:text-base">{cat.name}</span>
                    </div>
                    <div className="text-right">
                      {offering?.price ? (
                        <>
                          <div className="text-[10px] sm:text-xs font-bold text-ink-dim uppercase tracking-widest mb-0.5 sm:mb-1">From</div>
                          <div className="text-base sm:text-lg font-bold">
                            €{Number(offering.price).toFixed(0)}
                            <span className="text-ink-dim text-[11px] sm:text-xs font-medium ml-1">/hr</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-xs sm:text-sm font-medium text-ink-dim">Price on request</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Availability */}
          <div className="bg-white p-4 sm:p-6 rounded-panel border border-border-dim shadow-sm">
            <div className="flex items-center gap-2 mb-4 sm:mb-5">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-ink-sub" />
              <h3 className="text-base sm:text-lg font-bold">Typical Availability</h3>
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-4">
              {Object.entries(AVAILABILITY).map(([day, avail]) => (
                <div key={day} className="text-center">
                  <p className="text-[10px] sm:text-[11px] font-bold text-ink-dim uppercase mb-1.5">
                    {avail.label}
                  </p>
                  <div className={`rounded-xl py-2 sm:py-3 text-[10px] sm:text-[11px] font-bold uppercase tracking-wide ${
                    avail.slots.length > 0
                      ? 'bg-trust-surface text-trust border border-trust-edge'
                      : 'bg-surface-alt text-ink-dim border border-border-dim'
                  }`}>
                    {avail.slots.length > 0 ? `${avail.slots.length}` : '—'}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 sm:gap-4 mb-1.5">
              {(['morning', 'afternoon', 'evening'] as const).map(slot => {
                const Icon = SLOT_ICONS[slot];
                return (
                  <div key={slot} className="flex items-center gap-1.5 text-xs text-ink-sub font-medium">
                    <Icon className="w-3.5 h-3.5 text-ink-dim" />
                    <span className="capitalize">{slot}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-ink-dim/60">Times are approximate — confirm when booking</p>
          </div>

          {/* Reviews */}
          <div className="bg-white p-4 sm:p-6 rounded-panel border border-border-dim shadow-sm">
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <h3 className="text-base sm:text-lg font-bold">Reviews</h3>
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-brand fill-current" />
                <span className="font-bold text-sm">{provider.ratingAvg.toFixed(1)}</span>
                <span className="text-xs sm:text-sm text-ink-dim">({reviews.length})</span>
              </div>
            </div>

            {reviews.length > 0 && (
              <div className="space-y-1.5 mb-5 p-3.5 sm:p-4 bg-surface-alt rounded-2xl">
                {ratingDistribution.map(({ star, count }) => (
                  <div key={star} className="flex items-center gap-2.5 sm:gap-3">
                    <span className="text-[11px] font-bold text-ink-sub w-3 text-right shrink-0">{star}</span>
                    <Star className="w-3 h-3 text-brand fill-current shrink-0" />
                    <div className="flex-1 h-1.5 sm:h-2 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand rounded-full transition-all"
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-ink-dim w-3 shrink-0">{count}</span>
                  </div>
                ))}
              </div>
            )}

            {reviews.length === 0 ? (
              <div className="text-center py-8 text-ink-dim">
                <ThumbsUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No reviews yet. Be the first to book!</p>
              </div>
            ) : (
              <div className="space-y-3.5 sm:space-y-4">
                {reviews.slice(0, 5).map((review: any) => (
                  <div key={review.id} className="pb-3.5 sm:pb-4 border-b border-border-dim last:border-0 last:pb-0">
                    <div className="flex items-start gap-3 mb-2">
                      <img
                        src={review.customer?.user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.customer?.user?.name ?? 'User')}&size=80&background=cdd9d0&color=1c3828&bold=true&rounded=true`}
                        alt="Reviewer"
                        className="w-8 h-8 rounded-full shrink-0 object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold truncate">{review.customer?.user?.name ?? 'Customer'}</span>
                          <span className="text-[11px] text-ink-dim shrink-0">
                            {new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star key={i} className={`w-3 h-3 ${i <= review.rating ? 'text-brand fill-current' : 'text-ink-dim'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-ink-sub leading-relaxed pl-11">{review.comment}</p>
                    )}
                  </div>
                ))}
                {reviews.length > 5 && (
                  <p className="text-sm text-ink-dim text-center pt-1">+ {reviews.length - 5} more reviews</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column — Booking CTA ── */}
        <div className="lg:col-span-1">
          <div className="bg-white p-5 sm:p-8 rounded-panel border border-border-dim shadow-elevated lg:sticky lg:top-24">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-1.5 sm:mb-2 text-ink">Need help?</h3>
            <p className="text-ink-sub text-sm mb-4 sm:mb-6">
              Send a request to {provider.user.name.split(' ')[0]} and get a quote within the hour.
            </p>

            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
              {['No upfront payment', 'Free cancellation', 'Aladdin Guarantee'].map(item => (
                <div key={item} className="flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm font-medium text-ink-sub">
                  <div className="w-5 h-5 rounded-full bg-trust-surface flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-trust" />
                  </div>
                  {item}
                </div>
              ))}
            </div>

            <Link
              href={session
                ? `/requests/new?providerId=${provider.id}&category=${provider.categories[0]?.slug}`
                : `/login?callbackUrl=/providers/${provider.id}`}
              className="block w-full bg-brand text-white text-center py-3.5 sm:py-4 rounded-card font-bold hover:bg-brand-dark transition-all mb-3 shadow-sm hover:shadow-elevated text-sm sm:text-base"
            >
              Send Service Request
            </Link>

            <button
              disabled={chatLoading}
              onClick={async () => {
                if (chatLoading) return;
                setChatLoading(true);
                try {
                  const res = await fetch('/api/chat/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ providerId: provider.id }),
                  });
                  if (!res.ok) {
                    if (res.status === 401) { router.push('/login'); return; }
                    let msg = 'Could not start chat';
                    try { const data = await res.json(); msg = data.error || msg; } catch {}
                    alert(msg);
                    return;
                  }
                  const { threadId } = await res.json();
                  router.push(`/messages?thread=${threadId}`);
                } catch {
                  alert('Something went wrong. Please try again.');
                } finally {
                  setChatLoading(false);
                }
              }}
              className="w-full bg-surface-alt text-ink text-center py-3.5 sm:py-4 rounded-card font-bold hover:bg-border transition-all flex items-center justify-center gap-2 border border-border-dim text-sm sm:text-base disabled:opacity-50"
            >
              <MessageSquare className="w-4 h-4" />
              {chatLoading ? 'Opening chat...' : 'Chat with Pro'}
            </button>

            {/* Mini availability */}
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border-dim">
              <p className="text-[10px] sm:text-xs font-bold text-ink-dim uppercase tracking-widest mb-2.5 sm:mb-3">
                This week
              </p>
              <div className="flex gap-1 sm:gap-1.5">
                {Object.entries(AVAILABILITY).map(([day, avail]) => (
                  <div key={day} className="flex-1 text-center">
                    <p className="text-[10px] font-bold text-ink-dim uppercase mb-1">{day.slice(0, 1)}</p>
                    <div className={`rounded-md py-2 text-[10px] font-bold ${
                      avail.slots.length > 0
                        ? 'bg-trust text-white'
                        : 'bg-surface-alt text-ink-dim border border-border-dim'
                    }`}>
                      {avail.slots.length > 0 ? '✓' : '×'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
