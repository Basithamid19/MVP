'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
    { label: 'Completion rate', value: `${completionRate}%`, icon: CheckCircle2, color: completionRate >= 90 ? 'text-green-600' : completionRate >= 70 ? 'text-yellow-600' : 'text-red-500', gauge: completionRate, gaugeMax: 100, gaugeColor: completionRate >= 90 ? 'bg-green-500' : 'bg-yellow-400' },
    { label: 'Average rating', value: ratingAvg > 0 ? ratingAvg.toFixed(1) : '—', icon: Star, color: 'text-yellow-600', gauge: ratingAvg * 20, gaugeMax: 100, gaugeColor: 'bg-yellow-400' },
    { label: 'Jobs completed', value: completed.length, icon: Award, color: 'text-blue-600', gauge: Math.min(completed.length, 100), gaugeMax: 100, gaugeColor: 'bg-blue-500' },
    { label: 'Repeat customers', value: repeatCustomers, icon: ThumbsUp, color: 'text-purple-600', gauge: Math.min(repeatCustomers * 10, 100), gaugeMax: 100, gaugeColor: 'bg-purple-400' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Performance</h1>
          <p className="text-sm text-ink-dim mt-0.5">Track your quality metrics and standing</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${
          ratingAvg >= 4.5 ? 'bg-trust-surface text-trust' :
          ratingAvg >= 4.0 ? 'bg-info-surface text-info' :
          ratingAvg > 0 ? 'bg-caution-surface text-caution' : 'bg-surface-alt text-ink-dim'
        }`}>
          <TrendingUp className="w-4 h-4" />
          {ratingAvg >= 4.5 ? 'Top Pro' : ratingAvg >= 4.0 ? 'Good Standing' : ratingAvg > 0 ? 'Needs Improvement' : 'New Pro'}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {metrics.map(m => (
          <div key={m.label} className="bg-white rounded-2xl border border-border-dim p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <m.icon className={`w-4 h-4 ${m.color}`} />
              <p className="text-xs font-bold text-ink-dim uppercase tracking-widest">{m.label}</p>
            </div>
            <p className="text-3xl font-bold tracking-tight mb-3">{m.value}</p>
            <Gauge value={m.gauge} max={m.gaugeMax} color={m.gaugeColor} />
          </div>
        ))}
      </div>

      {/* Response speed */}
      <div className="bg-white rounded-2xl border border-border-dim p-5 shadow-sm mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">Response speed</p>
            <p className="text-xs text-ink-dim">{responseTime}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">Fast</p>
          </div>
        </div>
      </div>

      {/* Rating distribution */}
      {reviews.length > 0 && (
        <div className="bg-white rounded-2xl border border-border-dim p-5 shadow-sm mb-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold">Rating breakdown</p>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-brand fill-yellow-500" />
              <span className="font-bold">{ratingAvg.toFixed(1)}</span>
              <span className="text-sm text-ink-dim">({reviews.length})</span>
            </div>
          </div>
          <div className="space-y-2">
            {ratingDist.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-3">
                <span className="text-xs font-bold text-ink-dim w-3">{star}</span>
                <Star className="w-3 h-3 text-brand fill-yellow-400 shrink-0" />
                <div className="flex-1 h-2 bg-surface-alt rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${(count / maxRatingCount) * 100}%` }} />
                </div>
                <span className="text-xs text-ink-dim w-4 text-right">{count}</span>
              </div>
            ))}
          </div>
          {/* Recent reviews */}
          {reviews.slice(0, 3).map(r => (
            <div key={r.id} className="mt-4 pt-4 border-t border-gray-50">
              <div className="flex items-center gap-1 mb-1">
                {[1,2,3,4,5].map(i => <Star key={i} className={`w-3 h-3 ${i <= r.rating ? 'text-brand fill-yellow-400' : 'text-ink-dim'}`} />)}
                <span className="text-[10px] text-ink-dim ml-1">{new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
              </div>
              {r.comment && <p className="text-xs text-ink-sub italic">"{r.comment}"</p>}
            </div>
          ))}
        </div>
      )}

      {/* Warnings / penalties */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest">Account standing</p>
        {warnings.map((w, i) => (
          <div key={i} className={`flex items-start gap-3 p-4 rounded-2xl border ${
            w.type === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-100'
          }`}>
            {w.type === 'warning'
              ? <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              : <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            }
            <p className={`text-sm leading-relaxed ${w.type === 'warning' ? 'text-amber-800' : 'text-trust'}`}>
              {w.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
