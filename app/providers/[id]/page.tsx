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
  const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchProvider = async () => {
      try {
        const provRes = await fetch(`/api/providers?id=${id}`);
        if (provRes.ok) {
          const provData = await provRes.json();
          setProvider(provData?.id ? provData : null);
        }

        const revRes = await fetch(`/api/reviews?providerId=${id}`).catch(() => null);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center gap-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
          <ShieldCheck className="w-8 h-8 text-gray-300" />
        </div>
        <h1 className="text-2xl font-bold">Professional not found</h1>
        <p className="text-gray-400 text-sm max-w-xs">This profile may have been removed or the link is incorrect.</p>
        <Link href="/browse" className="mt-2 bg-black text-white px-6 py-3 rounded-2xl font-bold hover:bg-gray-800 transition-all text-sm">
          Browse all professionals
        </Link>
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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
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
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-32 h-32 bg-gray-100 rounded-[40px] overflow-hidden grayscale shrink-0">
                  <img src={provider.user.image || `https://i.pravatar.cc/300?u=${provider.id}`} alt={provider.user.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h2 className="text-3xl font-bold tracking-tight">{provider.user.name}</h2>
                    {provider.isVerified && (
                      <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        <ShieldCheck className="w-3 h-3" />
                        Verified
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-5 h-5 fill-current" />
                      <span className="text-black font-bold">{provider.ratingAvg.toFixed(1)}</span>
                      <span className="text-gray-400 text-sm font-medium ml-1">({reviews.length || provider.completedJobs} reviews)</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                      <MapPin className="w-4 h-4" />
                      {provider.serviceArea}
                    </div>
                  </div>

                  <p className="text-gray-500 leading-relaxed mb-6">
                    {provider.bio}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                        <Clock className="w-3 h-3" />
                        Response
                      </div>
                      <div className="text-sm font-bold">{provider.responseTime}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                        <Languages className="w-3 h-3" />
                        Languages
                      </div>
                      <div className="text-sm font-bold">{provider.languages.join(', ')}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">
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
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Award className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg font-bold">Quality Indicators</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {qualityIndicators.map((qi, i) => (
                  <div key={i} className={`p-4 rounded-2xl border text-center ${qi.positive ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                    <qi.icon className={`w-5 h-5 mx-auto mb-2 ${qi.positive ? 'text-green-600' : 'text-gray-400'}`} />
                    <p className="font-bold text-sm">{qi.value}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{qi.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Services */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold mb-5">Services & Pricing</h3>
              <div className="space-y-3">
                {provider.categories.map((cat: any) => (
                  <div key={cat.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                      <span className="font-bold">{cat.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Starting from</div>
                      <div className="text-lg font-bold">€25.00<span className="text-gray-400 text-xs font-medium ml-1">/hr</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Calendar className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-bold">Typical Availability</h3>
              </div>
              <div className="grid grid-cols-7 gap-1.5 mb-4">
                {Object.entries(AVAILABILITY).map(([day, avail]) => (
                  <div key={day} className="text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">{avail.label}</p>
                    <div className={`rounded-xl py-3 text-[10px] font-bold uppercase tracking-wide ${
                      avail.slots.length > 0 ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-50 text-gray-300 border border-gray-100'
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
                    <div key={slot} className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                      <Icon className="w-3.5 h-3.5 text-gray-400" />
                      <span className="capitalize">{slot}</span>
                    </div>
                  );
                })}
                <span className="text-xs text-gray-400 ml-auto">Times are approximate — confirm when booking</span>
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold">Reviews</h3>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold">{provider.ratingAvg.toFixed(1)}</span>
                  <span className="text-sm text-gray-400">({reviews.length} reviews)</span>
                </div>
              </div>

              {/* Rating distribution */}
              {reviews.length > 0 && (
                <div className="space-y-2 mb-6 p-4 bg-gray-50 rounded-2xl">
                  {ratingDistribution.map(({ star, count }) => (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-500 w-4 text-right">{star}</span>
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full transition-all"
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-4">{count}</span>
                    </div>
                  ))}
                </div>
              )}

              {reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <ThumbsUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No reviews yet. Be the first to book!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.slice(0, 5).map((review: any) => (
                    <div key={review.id} className="pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3 mb-2">
                        <img
                          src={`https://i.pravatar.cc/40?u=${review.customerId}`}
                          alt="Reviewer"
                          className="w-8 h-8 rounded-full shrink-0"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold">{review.customer?.user?.name ?? 'Customer'}</span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {[1,2,3,4,5].map(i => (
                              <Star key={i} className={`w-3 h-3 ${i <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      {review.comment && <p className="text-sm text-gray-600 leading-relaxed pl-11">{review.comment}</p>}
                    </div>
                  ))}
                  {reviews.length > 5 && (
                    <p className="text-sm text-gray-400 text-center pt-2">+ {reviews.length - 5} more reviews</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-black text-white p-8 rounded-[40px] shadow-2xl sticky top-24">
              <h3 className="text-2xl font-bold tracking-tight mb-2">Need help?</h3>
              <p className="text-gray-400 text-sm mb-6">Send a request to {provider.user.name.split(' ')[0]} and get a quote within the hour.</p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm font-medium">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                  No upfront payment
                </div>
                <div className="flex items-center gap-3 text-sm font-medium">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                  Free cancellation
                </div>
                <div className="flex items-center gap-3 text-sm font-medium">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                  VilniusPro Guarantee
                </div>
              </div>

              <Link 
                href={`/requests/new?providerId=${provider.id}&category=${provider.categories[0]?.slug}`}
                className="block w-full bg-white text-black text-center py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all mb-3"
              >
                Send Service Request
              </Link>
              
              <button
                disabled={startingChat}
                onClick={async () => {
                  setStartingChat(true);
                  try {
                    const res = await fetch('/api/chat/start', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ providerId: provider.id }),
                    });
                    if (res.status === 401) { router.push('/login'); return; }
                    if (res.ok) {
                      const { threadId } = await res.json();
                      router.push(`/chat/${threadId}`);
                    }
                  } catch {
                  } finally {
                    setStartingChat(false);
                  }
                }}
                className="w-full bg-white/10 text-white text-center py-4 rounded-2xl font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {startingChat
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <MessageSquare className="w-4 h-4" />}
                Chat with Pro
              </button>

              {/* Mini availability preview */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">This week</p>
                <div className="flex gap-1.5">
                  {Object.entries(AVAILABILITY).map(([day, avail]) => (
                    <div key={day} className="flex-1 text-center">
                      <p className="text-[9px] font-bold text-white/40 uppercase mb-1">{day.slice(0,1)}</p>
                      <div className={`rounded py-1.5 text-[9px] font-bold ${
                        avail.slots.length > 1 ? 'bg-green-500 text-white' :
                        avail.slots.length === 1 ? 'bg-green-900 text-green-300' :
                        'bg-white/10 text-white/20'
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
