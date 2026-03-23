'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

const AVAILABILITY: Record<string, { slots: string[]; label: string }> = {
  Mon: { slots: ['morning', 'afternoon'], label: 'Mon' },
  Tue: { slots: ['morning', 'afternoon', 'evening'], label: 'Tue' },
  Wed: { slots: ['afternoon', 'evening'], label: 'Wed' },
  Thu: { slots: ['morning', 'afternoon'], label: 'Thu' },
  Fri: { slots: ['morning', 'afternoon', 'evening'], label: 'Fri' },
  Sat: { slots: ['morning'], label: 'Sat' },
  Sun: { slots: [], label: 'Sun' },
};

const SLOT_ICONS: Record<string, React.ElementType> = {
  morning: Sunrise,
  afternoon: Sun,
  evening: Moon,
};

export default function ProviderProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [provider, setProvider] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProvider = async () => {
      try {
        const [provRes, revRes] = await Promise.all([
          fetch(`/api/providers?id=${id}`),
          fetch(`/api/reviews?providerId=${id}`).catch(() => null),
        ]);
        const provData = await provRes.json();
        // API returns a single object when queried by id
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
      <div className="min-h-screen flex items-center justify-center bg-surface-alt">
        <Loader2 className="w-8 h-8 animate-spin text-ink-dim" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-alt p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Provider not found</h1>
        <Link href="/browse" className="text-ink font-bold underline">Back to browse</Link>
      </div>
    );
  }

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }));
  const maxCount = Math.max(...ratingDistribution.map(r => r.count), 1);

  // Quality indicators derived from provider data
  const qualityIndicators = [
    { label: 'Jobs completed', value: `${provider.completedJobs}+`, icon: CheckCircle2, positive: true },
    { label: 'Response time', value: provider.responseTime, icon: Clock, positive: true },
    { label: 'Rating', value: `${provider.ratingAvg.toFixed(1)} / 5`, icon: Star, positive: true },
    { label: 'ID Verified', value: provider.isVerified ? 'Yes' : 'No', icon: ShieldCheck, positive: provider.isVerified },
  ];

  return (
    <div className="min-h-screen bg-canvas pb-20">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-border-dim sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => router.back()} className="p-2 hover:bg-surface-alt rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold">Professional Profile</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile card */}
            <div className="bg-white p-8 rounded-hero border border-border-dim shadow-card">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-32 h-32 bg-surface-alt rounded-hero overflow-hidden  shrink-0">
                  <img src={provider.user.image || `https://i.pravatar.cc/300?u=${provider.id}`} alt={provider.user.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h2 className="text-4xl font-bold tracking-tight text-ink">{provider.user.name}</h2>
                    {provider.isVerified && (
                      <div className="flex items-center gap-1 bg-trust-surface text-trust px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        <ShieldCheck className="w-3 h-3" />
                        Verified
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center gap-1 text-brand">
                      <Star className="w-5 h-5 fill-current" />
                      <span className="text-ink font-bold">{provider.ratingAvg.toFixed(1)}</span>
                      <span className="text-ink-dim text-sm font-medium ml-1">({reviews.length || provider.completedJobs} reviews)</span>
                    </div>
                    <div className="flex items-center gap-2 text-ink-dim text-sm font-medium">
                      <MapPin className="w-4 h-4" />
                      {provider.serviceArea}
                    </div>
                  </div>

                  <p className="text-ink-sub leading-relaxed mb-6">
                    {provider.bio}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-surface-alt rounded-card border border-border-dim">
                      <div className="flex items-center gap-1.5 text-ink-dim text-[10px] font-bold uppercase tracking-widest mb-1">
                        <Clock className="w-3 h-3" />
                        Response
                      </div>
                      <div className="text-sm font-bold">{provider.responseTime}</div>
                    </div>
                    <div className="p-3 bg-surface-alt rounded-card border border-border-dim">
                      <div className="flex items-center gap-1.5 text-ink-dim text-[10px] font-bold uppercase tracking-widest mb-1">
                        <Languages className="w-3 h-3" />
                        Languages
                      </div>
                      <div className="text-sm font-bold">{provider.languages.join(', ')}</div>
                    </div>
                    <div className="p-3 bg-surface-alt rounded-card border border-border-dim">
                      <div className="flex items-center gap-1.5 text-ink-dim text-[10px] font-bold uppercase tracking-widest mb-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Jobs done
                      </div>
                      <div className="text-sm font-bold">{provider.completedJobs}+</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quality indicators */}
            <div className="bg-white p-6 rounded-panel border border-border-dim shadow-card">
              <div className="flex items-center gap-2 mb-5">
                <Award className="w-5 h-5 text-brand" />
                <h3 className="text-lg font-bold">Quality Indicators</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {qualityIndicators.map((qi, i) => (
                  <div key={i} className={`p-4 rounded-card border text-center ${qi.positive ? 'bg-trust-surface border-trust-edge' : 'bg-surface-alt border-border-dim'}`}>
                    <qi.icon className={`w-5 h-5 mx-auto mb-2 ${qi.positive ? 'text-trust' : 'text-ink-dim'}`} />
                    <p className="font-bold text-sm">{qi.value}</p>
                    <p className="text-[10px] text-ink-dim mt-0.5">{qi.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Services */}
            <div className="bg-white p-6 rounded-panel border border-border-dim shadow-card">
              <h3 className="text-lg font-bold mb-5">Services & Pricing</h3>
              <div className="space-y-3">
                {provider.categories.map((cat: any) => (
                  <div key={cat.id} className="flex items-center justify-between p-4 bg-surface-alt rounded-card border border-border-dim">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-input flex items-center justify-center shadow-card">
                        <CheckCircle2 className="w-5 h-5 text-trust" />
                      </div>
                      <span className="font-bold">{cat.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-ink-dim uppercase tracking-widest mb-1">Starting from</div>
                      <div className="text-lg font-bold">€25.00<span className="text-ink-dim text-xs font-medium ml-1">/hr</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="bg-white p-6 rounded-panel border border-border-dim shadow-card">
              <div className="flex items-center gap-2 mb-5">
                <Calendar className="w-5 h-5 text-ink-sub" />
                <h3 className="text-lg font-bold">Typical Availability</h3>
              </div>
              <div className="grid grid-cols-7 gap-1.5 mb-4">
                {Object.entries(AVAILABILITY).map(([day, avail]) => (
                  <div key={day} className="text-center">
                    <p className="text-[10px] font-bold text-ink-dim uppercase mb-1.5">{avail.label}</p>
                    <div className={`rounded-input py-3 text-[10px] font-bold uppercase tracking-wide ${
                      avail.slots.length > 0 ? 'bg-trust-surface text-trust border border-trust-edge' : 'bg-surface-alt text-ink-dim border border-border-dim'
                    }`}>
                      {avail.slots.length > 0 ? `${avail.slots.length}` : '—'}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                {(['morning', 'afternoon', 'evening'] as const).map(slot => {
                  const Icon = SLOT_ICONS[slot];
                  return (
                    <div key={slot} className="flex items-center gap-1.5 text-xs text-ink-sub font-medium">
                      <Icon className="w-3.5 h-3.5 text-ink-dim" />
                      <span className="capitalize">{slot}</span>
                    </div>
                  );
                })}
                <span className="text-xs text-ink-dim ml-auto">Times are approximate — confirm when booking</span>
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white p-6 rounded-panel border border-border-dim shadow-card">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold">Reviews</h3>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-brand fill-yellow-500" />
                  <span className="font-bold">{provider.ratingAvg.toFixed(1)}</span>
                  <span className="text-sm text-ink-dim">({reviews.length} reviews)</span>
                </div>
              </div>

              {/* Rating distribution */}
              {reviews.length > 0 && (
                <div className="space-y-2 mb-6 p-4 bg-surface-alt rounded-card">
                  {ratingDistribution.map(({ star, count }) => (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-ink-sub w-4 text-right">{star}</span>
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
                      <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand rounded-full transition-all"
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-ink-dim w-4">{count}</span>
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
                <div className="space-y-4">
                  {reviews.slice(0, 5).map((review: any) => (
                    <div key={review.id} className="pb-4 border-b border-border-dim last:border-0 last:pb-0">
                      <div className="flex items-start gap-3 mb-2">
                        <img
                          src={`https://i.pravatar.cc/40?u=${review.customerId}`}
                          alt="Reviewer"
                          className="w-8 h-8 rounded-full shrink-0"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold">{review.customer?.user?.name ?? 'Customer'}</span>
                            <span className="text-[10px] text-ink-dim">
                              {new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {[1,2,3,4,5].map(i => (
                              <Star key={i} className={`w-3 h-3 ${i <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-ink-dim'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      {review.comment && <p className="text-sm text-ink-sub leading-relaxed pl-11">{review.comment}</p>}
                    </div>
                  ))}
                  {reviews.length > 5 && (
                    <p className="text-sm text-ink-dim text-center pt-2">+ {reviews.length - 5} more reviews</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-hero border border-border-dim shadow-elevated sticky top-24">
              <h3 className="text-2xl font-bold tracking-tight mb-2 text-ink">Need help?</h3>
              <p className="text-ink-sub text-sm mb-6">Send a request to {provider.user.name.split(' ')[0]} and get a quote within the hour.</p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm font-medium text-ink-sub">
                  <div className="w-5 h-5 rounded-full bg-trust-surface flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-trust" />
                  </div>
                  No upfront payment
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-ink-sub">
                  <div className="w-5 h-5 rounded-full bg-trust-surface flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-trust" />
                  </div>
                  Free cancellation
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-ink-sub">
                  <div className="w-5 h-5 rounded-full bg-trust-surface flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-trust" />
                  </div>
                  VilniusPro Guarantee
                </div>
              </div>

              <Link 
                href={`/requests/new?providerId=${provider.id}&category=${provider.categories[0]?.slug}`}
                className="block w-full bg-brand text-white text-center py-4 rounded-card font-bold hover:bg-brand-dark transition-all mb-3 shadow-card hover:shadow-elevated"
              >
                Send Service Request
              </Link>
              
              <button className="w-full bg-surface-alt text-ink text-center py-4 rounded-card font-bold hover:bg-border transition-all flex items-center justify-center gap-2 border border-border-dim">
                <MessageSquare className="w-4 h-4" />
                Chat with Pro
              </button>

              {/* Mini availability preview */}
              <div className="mt-6 pt-6 border-t border-border-dim">
                <p className="text-xs font-bold text-ink-dim uppercase tracking-widest mb-3">This week</p>
                <div className="flex gap-1.5">
                  {Object.entries(AVAILABILITY).map(([day, avail]) => (
                    <div key={day} className="flex-1 text-center">
                      <p className="text-[9px] font-bold text-ink-dim uppercase mb-1">{day.slice(0,1)}</p>
                      <div className={`rounded py-1.5 text-[9px] font-bold ${
                        avail.slots.length > 1 ? 'bg-trust text-white' :
                        avail.slots.length === 1 ? 'bg-trust text-white' :
                        'bg-surface-alt text-ink-dim border border-border-dim'
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
      </div>
    </div>
  );
}
