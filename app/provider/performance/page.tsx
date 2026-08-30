'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card, PageHeader, Skeleton, StatusBadge, type BadgeVariant,
} from '@/components/ui';
import {
  Star, CheckCircle2, AlertTriangle, ThumbsUp, Zap, Award,
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

  if (loading) return (
    <div className="max-w-3xl mx-auto">
      <Skeleton rounded="chip" className="h-8 w-48 mb-6 sm:mb-8" />
      <Skeleton rounded="card" className="h-64 mb-4 sm:mb-6" />
      <Skeleton rounded="card" className="h-48" />
    </div>
  );

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

  const statusLabel = ratingAvg >= 4.5 ? 'Top Pro' : ratingAvg >= 4.0 ? 'Good Standing' : ratingAvg > 0 ? 'Needs Improvement' : 'New Pro';
  const statusBadge: BadgeVariant = ratingAvg >= 4.5 ? 'success'
    : ratingAvg >= 4.0 ? 'brand'
    : ratingAvg > 0 ? 'warning'
    : 'neutral';

  return (
    <div className="max-w-3xl mx-auto">
      {/* Mobile-only section tabs */}
      <div className="md:hidden flex gap-1 p-1 bg-surface-alt rounded-card border border-border-dim mb-5">
        <div className="flex-1 py-2 rounded-input text-sm font-semibold text-center transition-all bg-card text-brand shadow-card">
          Performance
        </div>
        <Link href="/provider/earnings" className="flex-1 py-2 rounded-input text-sm font-medium text-center transition-all text-ink-sub hover:text-ink">
          Earnings
        </Link>
      </div>

      {/* Header — the standing pill lives in the header at every width */}
      <PageHeader
        title="Performance"
        description="Track your quality metrics and standing"
        className="mb-4 sm:mb-8"
        action={<StatusBadge variant={statusBadge} label={statusLabel} dot size="md" />}
      />

      {/* ── Business Health Snapshot — one divided card at every width ── */}
      <Card padding="none" className="overflow-hidden mb-4 sm:mb-6">
        {/* Hero metrics: completion rate + rating */}
        <div className="grid grid-cols-2 divide-x divide-border-dim">
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 className={`w-4 h-4 ${completionRate >= 90 ? 'text-trust' : completionRate >= 70 ? 'text-caution' : 'text-danger'}`} />
              <p className="text-3xs font-bold text-ink-dim uppercase tracking-widest">Completion</p>
            </div>
            <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink mb-2.5 sm:mb-4">{completionRate}%</p>
            <Gauge value={completionRate} max={100} color={completionRate >= 90 ? 'bg-trust' : 'bg-caution'} />
          </div>
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-1.5 mb-2">
              <Star className="w-4 h-4 text-brand" />
              <p className="text-3xs font-bold text-ink-dim uppercase tracking-widest">Rating</p>
            </div>
            <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink mb-2.5 sm:mb-4">{ratingAvg > 0 ? ratingAvg.toFixed(1) : '—'}</p>
            <Gauge value={ratingAvg * 20} max={100} color="bg-brand" />
          </div>
        </div>

        {/* Response speed */}
        <div className="border-t border-border-dim px-4 py-3.5 sm:px-6 sm:py-4 flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 bg-trust-surface rounded-full flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-trust" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base font-semibold text-ink">Response speed</p>
            <p className="text-xs sm:text-sm text-ink-sub">{responseTime}</p>
          </div>
          <StatusBadge variant="success" label="Fast" className="shrink-0" />
        </div>

        {/* Jobs + Repeat customers */}
        <div className="border-t border-border-dim grid grid-cols-2 divide-x divide-border-dim">
          <div className="px-4 py-3.5 sm:px-6 sm:py-4 flex items-center gap-2.5 sm:gap-3">
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-ink-dim shrink-0" />
            <div>
              <p className="text-lg sm:text-xl font-semibold text-ink leading-tight">{completed.length}</p>
              <p className="text-3xs font-bold text-ink-dim uppercase tracking-widest">Jobs done</p>
            </div>
          </div>
          <div className="px-4 py-3.5 sm:px-6 sm:py-4 flex items-center gap-2.5 sm:gap-3">
            <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5 text-ink-dim shrink-0" />
            <div>
              <p className="text-lg sm:text-xl font-semibold text-ink leading-tight">{repeatCustomers}</p>
              <p className="text-3xs font-bold text-ink-dim uppercase tracking-widest">Repeat</p>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Trust & Quality — rating breakdown + standing in one card ── */}
      <p className="text-3xs font-bold text-ink-dim uppercase tracking-widest mb-3">Trust &amp; Quality</p>
      <Card padding="none" className="overflow-hidden">
        {reviews.length > 0 && (
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-5">
              <p className="font-semibold text-ink text-sm sm:text-base">Rating breakdown</p>
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-brand fill-brand" />
                <span className="font-semibold text-ink text-sm sm:text-base">{ratingAvg.toFixed(1)}</span>
                <span className="text-xs sm:text-sm text-ink-sub">({reviews.length})</span>
              </div>
            </div>

            {/* Full distribution once there are enough reviews to shape one */}
            {reviews.length >= 3 ? (
              <div className="space-y-2.5 sm:space-y-3">
                {ratingDist.map(({ star, count }) => (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-ink-dim w-3">{star}</span>
                    <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand fill-brand shrink-0" />
                    <div className="flex-1 h-1.5 sm:h-2 bg-surface-alt rounded-full overflow-hidden">
                      <div className="h-full bg-brand rounded-full" style={{ width: `${(count / maxRatingCount) * 100}%` }} />
                    </div>
                    <span className="text-xs text-ink-dim w-4 text-right">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              /* Compact layout for 1–2 reviews */
              <div className="flex items-center gap-3 py-1">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`w-4 h-4 ${i <= Math.round(ratingAvg) ? 'text-brand fill-brand' : 'text-border'}`} />
                  ))}
                </div>
                <span className="text-xs text-ink-sub">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
              </div>
            )}

            {reviews.slice(0, 3).map(r => (
              <div key={r.id} className="mt-4 pt-4 sm:mt-5 sm:pt-5 border-t border-border-dim">
                <div className="flex items-center gap-1 mb-1.5 sm:mb-2">
                  {[1,2,3,4,5].map(i => <Star key={i} className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${i <= r.rating ? 'text-brand fill-brand' : 'text-border'}`} />)}
                  <span className="text-xs text-ink-dim ml-2">{new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                </div>
                {r.comment && <p className="text-sm text-ink-sub italic">"{r.comment}"</p>}
              </div>
            ))}
          </div>
        )}

        {/* Account standing — inside the same card */}
        <div className={`${reviews.length > 0 ? 'border-t border-border-dim' : ''} p-4 sm:p-6 space-y-2.5 sm:space-y-3`}>
          <p className="text-3xs font-bold text-ink-dim uppercase tracking-widest mb-1">Account standing</p>
          {warnings.map((w, i) => (
            <div key={i} className={`flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-input sm:rounded-card border ${
              w.type === 'warning' ? 'bg-caution-surface border-caution-edge' : 'bg-trust-surface border-trust-edge'
            }`}>
              {w.type === 'warning'
                ? <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-caution shrink-0 mt-0.5" />
                : <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-trust shrink-0 mt-0.5" />
              }
              <p className={`text-xs sm:text-sm leading-relaxed ${w.type === 'warning' ? 'text-caution' : 'text-trust'}`}>
                {w.message}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
