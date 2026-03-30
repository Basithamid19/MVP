'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, Star, CheckCircle2, Clock, RefreshCcw,
  TrendingUp, AlertTriangle, ThumbsUp, Zap, Award,
} from 'lucide-react';

function Gauge({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full bg-surface-alt rounded-full h-2">
      <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function PerformancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') {
      Promise.all([
        fetch('/api/provider/profile').then(r => r.json()),
        fetch('/api/bookings').then(r => r.json()),
      ]).then(([prof, bks]) => {
        setProfile(prof);
        const bkArr = Array.isArray(bks) ? bks : [];
        setBookings(bkArr);
        const provId = prof?.id;
        if (provId) {
          fetch(`/api/reviews?providerId=${provId}`)
            .then(r => r.json())
            .then(d => { if (Array.isArray(d)) setReviews(d); })
            .catch(() => {});
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [status, router]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-ink-dim" /></div>;

  const completed = bookings.filter(b => b.status === 'COMPLETED');
  const canceled = bookings.filter(b => b.status === 'CANCELED');
  const total = bookings.length;

  const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 100;
  const cancellationRate = total > 0 ? Math.round((canceled.length / total) * 100) : 0;
  const ratingAvg = profile?.ratingAvg ?? 0;
  const responseTime = profile?.responseTime ?? 'N/A';

  // Repeat customers (customers who booked more than once)
  const customerCounts: Record<string, number> = {};
  bookings.forEach(b => { const id = b.customerId ?? b.customer?.id; if (id) customerCounts[id] = (customerCounts[id] ?? 0) + 1; });
  const repeatCustomers = Object.values(customerCounts).filter(c => c > 1).length;

  // Rating breakdown
  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star, count: reviews.filter(r => r.rating === star).length,
  }));
  const maxRatingCount = Math.max(...ratingDist.map(r => r.count), 1);

  // Warnings / penalties
  const warnings: { type: 'warning' | 'info'; message: string }[] = [];
  if (cancellationRate > 20) warnings.push({ type: 'warning', message: 'High cancellation rate (>20%). Frequent cancellations can reduce your lead visibility.' });
  if (ratingAvg > 0 && ratingAvg < 4.0) warnings.push({ type: 'warning', message: 'Your rating is below 4.0. Customers with ratings below 3.5 may be temporarily paused.' });
  if (completionRate < 80) warnings.push({ type: 'warning', message: 'Completion rate below 80%. Completing more jobs improves your ranking.' });
  if (warnings.length === 0) warnings.push({ type: 'info', message: 'Great work! No active warnings or penalties on your account.' });

  const metrics = [
    { label: 'Completion rate', value: `${completionRate}%`, icon: CheckCircle2, color: completionRate >= 90 ? 'text-trust' : completionRate >= 70 ? 'text-caution' : 'text-danger', gauge: completionRate, gaugeMax: 100, gaugeColor: completionRate >= 90 ? 'bg-trust' : 'bg-caution' },
    { label: 'Average rating', value: ratingAvg > 0 ? ratingAvg.toFixed(1) : '—', icon: Star, color: 'text-brand', gauge: ratingAvg * 20, gaugeMax: 100, gaugeColor: 'bg-brand' },
    { label: 'Jobs completed', value: completed.length, icon: Award, color: 'text-ink', gauge: Math.min(completed.length, 100), gaugeMax: 100, gaugeColor: 'bg-ink/20' },
    { label: 'Repeat customers', value: repeatCustomers, icon: ThumbsUp, color: 'text-ink', gauge: Math.min(repeatCustomers * 10, 100), gaugeMax: 100, gaugeColor: 'bg-ink/20' },
  ];

  const statusLabel = ratingAvg >= 4.5 ? 'Top Pro' : ratingAvg >= 4.0 ? 'Good Standing' : ratingAvg > 0 ? 'Needs Improvement' : 'New Pro';
  const statusStyle = ratingAvg >= 4.5 ? 'bg-trust-surface text-trust' :
    ratingAvg >= 4.0 ? 'bg-brand-muted text-brand' :
    ratingAvg > 0 ? 'bg-caution-surface text-caution' : 'bg-surface-alt text-ink-dim';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Mobile-only section tabs */}
      <div className="md:hidden flex gap-1 p-1 bg-surface-alt rounded-2xl shadow-sm mb-5">
        <div className="flex-1 py-2 rounded-xl text-sm font-semibold text-center transition-all bg-white text-brand shadow-card">
          Performance
        </div>
        <Link href="/provider/earnings" className="flex-1 py-2 rounded-xl text-sm font-medium text-center transition-all text-ink-sub hover:text-ink">
          Earnings
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">Performance</h1>
          <p className="text-sm text-ink-sub mt-1">Track your quality metrics and standing</p>
          {/* Status pill — below subtitle on mobile, beside title on desktop */}
          <div className={`sm:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mt-2.5 ${statusStyle}`}>
            <TrendingUp className="w-3.5 h-3.5" />
            {statusLabel}
          </div>
        </div>
        <div className={`hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${statusStyle}`}>
          <TrendingUp className="w-4 h-4" />
          {statusLabel}
        </div>
      </div>

      {/* ── Mobile: Business Health Snapshot (single card) ── */}
      <div className="sm:hidden bg-white rounded-2xl border border-border-dim shadow-sm mb-5 overflow-hidden">
        {/* Hero metrics: completion rate + rating */}
        <div className="grid grid-cols-2 divide-x divide-border-dim">
          <div className="p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 className={`w-4 h-4 ${completionRate >= 90 ? 'text-trust' : completionRate >= 70 ? 'text-caution' : 'text-danger'}`} />
              <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest">Completion</p>
            </div>
            <p className="text-2xl font-semibold tracking-tight text-ink mb-2.5">{completionRate}%</p>
            <Gauge value={completionRate} max={100} color={completionRate >= 90 ? 'bg-trust' : 'bg-caution'} />
          </div>
          <div className="p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Star className="w-4 h-4 text-brand" />
              <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest">Rating</p>
            </div>
            <p className="text-2xl font-semibold tracking-tight text-ink mb-2.5">{ratingAvg > 0 ? ratingAvg.toFixed(1) : '—'}</p>
            <Gauge value={ratingAvg * 20} max={100} color="bg-brand" />
          </div>
        </div>

        {/* Response speed */}
        <div className="border-t border-border-dim px-4 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 bg-trust-surface rounded-full flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-trust" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink">Response speed</p>
            <p className="text-xs text-ink-sub">{responseTime}</p>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-trust bg-trust-surface px-2.5 py-1 rounded-full shrink-0">Fast</p>
        </div>

        {/* Jobs + Repeat customers */}
        <div className="border-t border-border-dim grid grid-cols-2 divide-x divide-border-dim">
          <div className="px-4 py-3.5 flex items-center gap-2.5">
            <Award className="w-4 h-4 text-ink-dim shrink-0" />
            <div>
              <p className="text-lg font-semibold text-ink leading-tight">{completed.length}</p>
              <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest">Jobs done</p>
            </div>
          </div>
          <div className="px-4 py-3.5 flex items-center gap-2.5">
            <ThumbsUp className="w-4 h-4 text-ink-dim shrink-0" />
            <div>
              <p className="text-lg font-semibold text-ink leading-tight">{repeatCustomers}</p>
              <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest">Repeat</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Desktop: Original metric cards grid ── */}
      <div className="hidden sm:grid sm:grid-cols-2 gap-4 mb-6 sm:mb-8">
        {metrics.map(m => (
          <div key={m.label} className="bg-white rounded-2xl border border-border-dim p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <m.icon className={`w-5 h-5 ${m.color}`} />
              <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest">{m.label}</p>
            </div>
            <p className="text-3xl font-semibold tracking-tight text-ink mb-4">{m.value}</p>
            <Gauge value={m.gauge} max={m.gaugeMax} color={m.gaugeColor} />
          </div>
        ))}
      </div>

      {/* ── Desktop: Response speed card ── */}
      <div className="hidden sm:block bg-white rounded-2xl border border-border-dim p-5 sm:p-6 shadow-sm mb-5 sm:mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-trust-surface rounded-full flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-trust" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-ink text-base mb-1">Response speed</p>
            <p className="text-sm text-ink-sub">{responseTime}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-trust bg-trust-surface px-2.5 py-1 rounded-full">Fast</p>
          </div>
        </div>
      </div>

      {/* ── Mobile: Trust & Quality section (combined card) ── */}
      {(reviews.length > 0 || warnings.length > 0) && (
        <div className="sm:hidden">
          <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-3">Trust & Quality</p>
          <div className="bg-white rounded-2xl border border-border-dim shadow-sm overflow-hidden mb-5">
            {/* Rating section */}
            {reviews.length > 0 && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-ink text-sm">Rating breakdown</p>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-brand fill-brand" />
                    <span className="font-semibold text-ink text-sm">{ratingAvg.toFixed(1)}</span>
                    <span className="text-xs text-ink-sub">({reviews.length})</span>
                  </div>
                </div>

                {/* Full distribution for 3+ reviews */}
                {reviews.length >= 3 ? (
                  <div className="space-y-2.5">
                    {ratingDist.map(({ star, count }) => (
                      <div key={star} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-ink-dim w-3">{star}</span>
                        <Star className="w-3.5 h-3.5 text-brand fill-brand shrink-0" />
                        <div className="flex-1 h-1.5 bg-surface-alt rounded-full overflow-hidden">
                          <div className="h-full bg-brand rounded-full" style={{ width: `${(count / maxRatingCount) * 100}%` }} />
                        </div>
                        <span className="text-xs text-ink-dim w-4 text-right">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Compact layout for 1-2 reviews */
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`w-4 h-4 ${i <= Math.round(ratingAvg) ? 'text-brand fill-brand' : 'text-border'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-ink-sub">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
                  </div>
                )}

                {/* First review always visible, rest hidden on mobile */}
                {reviews.slice(0, 3).map((r, idx) => (
                  <div key={r.id} className={`mt-4 pt-4 border-t border-border-dim ${idx > 0 ? 'hidden sm:block' : ''}`}>
                    <div className="flex items-center gap-1 mb-1.5">
                      {[1,2,3,4,5].map(i => <Star key={i} className={`w-3.5 h-3.5 ${i <= r.rating ? 'text-brand fill-brand' : 'text-border'}`} />)}
                      <span className="text-xs text-ink-dim ml-2">{new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    {r.comment && <p className="text-sm text-ink-sub italic">"{r.comment}"</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Account standing — inside same card */}
            <div className={`${reviews.length > 0 ? 'border-t border-border-dim' : ''} p-4 space-y-2.5`}>
              <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-1">Account standing</p>
              {warnings.map((w, i) => (
                <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl ${
                  w.type === 'warning' ? 'bg-caution-surface border border-caution-edge' : 'bg-trust-surface border border-trust-edge'
                }`}>
                  {w.type === 'warning'
                    ? <AlertTriangle className="w-4 h-4 text-caution shrink-0 mt-0.5" />
                    : <CheckCircle2 className="w-4 h-4 text-trust shrink-0 mt-0.5" />
                  }
                  <p className={`text-xs leading-relaxed ${w.type === 'warning' ? 'text-caution' : 'text-trust'}`}>
                    {w.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop: Rating distribution (separate card) ── */}
      {reviews.length > 0 && (
        <div className="hidden sm:block bg-white rounded-2xl border border-border-dim p-5 sm:p-6 shadow-sm mb-5 sm:mb-6">
          <div className="flex items-center justify-between mb-5">
            <p className="font-semibold text-ink text-base">Rating breakdown</p>
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-brand fill-brand" />
              <span className="font-semibold text-ink">{ratingAvg.toFixed(1)}</span>
              <span className="text-sm text-ink-sub">({reviews.length})</span>
            </div>
          </div>
          <div className="space-y-3">
            {ratingDist.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-3">
                <span className="text-xs font-bold text-ink-dim w-3">{star}</span>
                <Star className="w-4 h-4 text-brand fill-brand shrink-0" />
                <div className="flex-1 h-2 bg-surface-alt rounded-full overflow-hidden">
                  <div className="h-full bg-brand rounded-full" style={{ width: `${(count / maxRatingCount) * 100}%` }} />
                </div>
                <span className="text-xs text-ink-dim w-4 text-right">{count}</span>
              </div>
            ))}
          </div>
          {reviews.slice(0, 3).map(r => (
            <div key={r.id} className="mt-5 pt-5 border-t border-border-dim">
              <div className="flex items-center gap-1 mb-2">
                {[1,2,3,4,5].map(i => <Star key={i} className={`w-4 h-4 ${i <= r.rating ? 'text-brand fill-brand' : 'text-border'}`} />)}
                <span className="text-xs text-ink-dim ml-2">{new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
              </div>
              {r.comment && <p className="text-sm text-ink-sub italic">"{r.comment}"</p>}
            </div>
          ))}
        </div>
      )}

      {/* ── Desktop: Account standing (separate section) ── */}
      <div className="hidden sm:block space-y-3">
        <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest">Account standing</p>
        {warnings.map((w, i) => (
          <div key={i} className={`flex items-start gap-3 p-4 rounded-2xl border ${
            w.type === 'warning' ? 'bg-caution-surface border-caution-edge' : 'bg-trust-surface border-trust-edge'
          }`}>
            {w.type === 'warning'
              ? <AlertTriangle className="w-5 h-5 text-caution shrink-0 mt-0.5" />
              : <CheckCircle2 className="w-5 h-5 text-trust shrink-0 mt-0.5" />
            }
            <p className={`text-sm leading-relaxed ${w.type === 'warning' ? 'text-caution' : 'text-trust'}`}>
              {w.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
