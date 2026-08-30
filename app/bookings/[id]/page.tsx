'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import CustomerLayout from '@/components/CustomerLayout';
import { avatarUrl } from '@/lib/avatar';
import {
  ArrowLeft, Star, ShieldCheck, MapPin, Calendar,
  Clock, Phone, MessageSquare, CheckCircle2, XCircle,
  Loader2, AlertCircle, DollarSign, Timer, LifeBuoy,
  ChevronRight, Info,
} from 'lucide-react';
import ChatPage from '@/components/shared/chat-view';
import { formatVilnius } from '@/lib/time';
import { DEPOSIT_RATE } from '@/lib/fees';
import { localizedStatus } from '@/lib/status-labels';
import { useTranslation } from '@/lib/i18n';
import type { Dictionary } from '@/lib/i18n/types';

const STEP_INDEX: Record<string, number> = {
  SCHEDULED: 0,
  IN_PROGRESS: 1,
  COMPLETED: 2,
  CANCELED: -1,
};

function deriveEta(booking: any, s: Dictionary['bookingDetail']): string | null {
  if (!booking) return null;
  if (booking.status === 'COMPLETED' || booking.status === 'CANCELED') return null;
  if (booking.status === 'IN_PROGRESS') return s.enRoute;
  const scheduled = new Date(booking.scheduledAt);
  const now = new Date();
  const diffMs = scheduled.getTime() - now.getTime();
  if (diffMs <= 0) return s.arrivingSoon;
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffM = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (diffH > 24) {
    return `${s.inPrefix} ${Math.floor(diffH / 24)} ${Math.floor(diffH / 24) > 1 ? s.days : s.day}`;
  }
  if (diffH > 0) return `${s.inPrefix} ~${diffH}${s.hoursShort} ${diffM}${s.minutesShort}`;
  return `${s.inPrefix} ~${diffM} ${s.minutesLong}`;
}

export default function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslation();

  const BOOKING_STEPS = [
    t.bookingDetail.stepScheduled,
    t.bookingDetail.stepInProgress,
    t.bookingDetail.stepCompleted,
  ];
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [payingDeposit, setPayingDeposit] = useState(false);
  const [review, setReview] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [approvingPrice, setApprovingPrice] = useState(false);
  const [priceApproved, setPriceApproved] = useState(false);
  const [reportingIssue, setReportingIssue] = useState(false);
  const [issueText, setIssueText] = useState('');
  const [submittingIssue, setSubmittingIssue] = useState(false);

  const submitIssue = async () => {
    if (!issueText.trim()) return;
    setSubmittingIssue(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `Booking issue — ${String(id).slice(0, 8)}`,
          description: issueText.trim(),
        }),
      });
      if (res.ok) {
        setReportingIssue(false);
        setIssueText('');
        alert(t.bookingDetail.issueReported);
      } else {
        const d = await res.json().catch(() => ({} as any));
        alert(d.error ?? t.bookingDetail.issueFailed);
      }
    } catch {
      alert(t.common.networkError);
    } finally {
      setSubmittingIssue(false);
    }
  };

  const load = useCallback(() => {
    fetch(`/api/bookings?id=${id}`)
      .then(r => r.json())
      .then(d => { setBooking(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Stripe return feedback: checkout redirects back with ?payment=success|canceled.
  // Read from window.location (not useSearchParams) to avoid the Suspense
  // requirement. On success, poll until the webhook lands so the page flips to
  // 'deposit paid' without a manual refresh.
  const [paymentBanner, setPaymentBanner] = useState<'success' | 'canceled' | null>(null);
  const pollAttempts = useRef(0);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('payment');
    if (p === 'success' || p === 'canceled') setPaymentBanner(p);
  }, []);

  const paymentConfirmed = ['DEPOSIT_HELD', 'PAID', 'PROCESSING'].includes(booking?.payment?.status);

  useEffect(() => {
    if (paymentBanner !== 'success' || paymentConfirmed) return;
    if (pollAttempts.current >= 10) return;
    const t = setTimeout(() => { pollAttempts.current += 1; load(); }, 3000);
    return () => clearTimeout(t);
  }, [paymentBanner, paymentConfirmed, load]);

  const updateStatus = async (status: string) => {
    setActioning(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: id, status }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({} as any));
        alert(d.error ?? t.bookingDetail.updateFailed);
      }
      load();
    } finally {
      setActioning(false);
      setShowCancelConfirm(false);
    }
  };

  const handleCancel = async () => {
    setActioning(true);
    try {
      await fetch('/api/payments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: id }),
      });
      load();
    } finally {
      setActioning(false);
      setShowCancelConfirm(false);
    }
  };

  const handlePayDeposit = async () => {
    setPayingDeposit(true);
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? t.bookingDetail.checkoutFailed);
      }
    } finally {
      setPayingDeposit(false);
    }
  };

  const submitReview = async () => {
    if (!review.rating) return;
    setSubmittingReview(true);
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: id, rating: review.rating, comment: review.comment }),
      });
      setReviewSubmitted(true);
      load();
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleApprovePrice = async () => {
    setApprovingPrice(true);
    await new Promise(r => setTimeout(r, 600));
    setPriceApproved(true);
    setApprovingPrice(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <Loader2 className="w-8 h-8 animate-spin text-ink-dim" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-canvas text-center p-4">
        <p className="text-xl font-bold mb-2">{t.bookingDetail.notFound}</p>
        <Link href="/dashboard" className="text-brand font-bold hover:underline">{t.common.backToDashboard}</Link>
      </div>
    );
  }

  if (showChat) {
    if (!booking.chatThread?.id) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <p className="text-ink-sub text-sm mb-4">{t.bookingDetail.noChat}</p>
          <button onClick={() => setShowChat(false)} className="text-brand font-semibold text-sm">{t.bookingDetail.goBack}</button>
        </div>
      );
    }
    return (
      <ChatPage
        threadId={booking.chatThread.id}
        booking={booking}
      />
    );
  }

  const provider = booking.provider;
  const category = booking.quote?.request?.category;
  const stepIdx = STEP_INDEX[booking.status] ?? 0;
  const isCanceled = booking.status === 'CANCELED';
  const isCompleted = booking.status === 'COMPLETED';
  // Messaging only unlocks once the booking is confirmed: deposit held (or
  // later). Mirrors the server-side gate in lib/chat-access.ts.
  const chatUnlocked =
    ['DEPOSIT_HELD', 'PAID', 'PROCESSING'].includes(booking.payment?.status) ||
    ['IN_PROGRESS', 'COMPLETED'].includes(booking.status);
  const eta = deriveEta(booking, t.bookingDetail);
  const quotedPrice = booking.quote?.price;
  const finalPrice = booking.totalAmount;
  const priceAdjusted = quotedPrice && finalPrice && Math.abs(finalPrice - quotedPrice) > 0.01;

  return (
    <CustomerLayout maxWidth="max-w-2xl">
      {/* Inline sub-header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-surface-alt rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-lg">{category?.name ?? t.bookingDetail.bookingFallback}</h1>
          <p className="text-xs text-ink-dim">ID: {booking.id.slice(0, 8)}…</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${localizedStatus(t, 'booking', booking.status).cls}`}>
          {localizedStatus(t, 'booking', booking.status).label}
        </span>
      </div>

      <div className="space-y-5 pb-24">
        {/* Status timeline */}
        {!isCanceled && (
          <div className="bg-white rounded-panel border border-border-dim p-6 shadow-card">
            <p className="text-xs font-bold text-ink-dim uppercase tracking-widest mb-4">{t.bookingDetail.jobProgress}</p>
            <div className="flex items-center mb-4">
              {BOOKING_STEPS.map((s, i) => (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      i <= stepIdx ? 'bg-brand text-white' : 'bg-surface-alt text-ink-dim'
                    }`}>
                      {i < stepIdx ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                    </div>
                    <span className={`text-2xs font-bold mt-1 ${i === stepIdx ? 'text-ink' : 'text-ink-dim'}`}>{s}</span>
                  </div>
                  {i < BOOKING_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mb-4 ${i < stepIdx ? 'bg-brand' : 'bg-surface-alt'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
            {eta && (
              <div className="flex items-center gap-3 px-4 py-3 bg-info-surface rounded-card border border-info-edge">
                <Timer className="w-5 h-5 text-info shrink-0" />
                <div>
                  <p className="text-sm font-bold text-info">{t.bookingDetail.providerEta}</p>
                  <p className="text-xs text-info">{eta}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {isCanceled && (
          <div className="bg-danger-surface border border-danger-edge rounded-card p-4 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-danger shrink-0" />
            <p className="text-sm font-medium text-danger">{t.bookingDetail.canceledNotice}</p>
          </div>
        )}

        {/* Stripe return feedback */}
        {paymentBanner === 'success' && (
          paymentConfirmed ? (
            <div className="flex items-center gap-3 px-4 py-3 bg-trust-surface border border-trust-edge rounded-card">
              <CheckCircle2 className="w-5 h-5 text-trust shrink-0" />
              <p className="text-sm font-medium text-trust">{t.bookingDetail.depositReceived}</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3 bg-info-surface border border-info-edge rounded-card">
              <Loader2 className="w-5 h-5 text-info shrink-0 animate-spin" />
              <p className="text-sm font-medium text-info">{t.bookingDetail.finalizing}</p>
            </div>
          )
        )}
        {paymentBanner === 'canceled' && (
          <div className="flex items-start justify-between gap-3 px-4 py-3 bg-caution-surface border border-caution-edge rounded-card">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-caution shrink-0" />
              <p className="text-sm font-medium text-caution">{t.bookingDetail.paymentCanceled}</p>
            </div>
            <button onClick={() => setPaymentBanner(null)} className="shrink-0 text-caution hover:opacity-70 text-xs font-bold">{t.bookingDetail.dismiss}</button>
          </div>
        )}

        {/* Deposit payment banner */}
        {!isCanceled && booking.payment?.status === 'PENDING' && (
          <div className="bg-caution-surface border border-caution-edge rounded-panel p-5 shadow-card">
            <div className="flex items-start gap-3 mb-4">
              <Info className="w-5 h-5 text-caution shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-caution">{t.bookingDetail.depositRequiredTitle}</p>
                <p className="text-sm text-caution mt-1 leading-relaxed">
                  {t.bookingDetail.depositPayPrefix} <span className="font-bold">€{booking.payment?.depositAmount?.toFixed(2) ?? (booking.totalAmount * DEPOSIT_RATE).toFixed(2)} {t.bookingDetail.depositBold}</span> {t.bookingDetail.depositPaySuffix}
                </p>
              </div>
            </div>
            <button
              onClick={handlePayDeposit}
              disabled={payingDeposit}
              className="w-full bg-brand text-white py-3 rounded-input font-bold text-sm hover:bg-brand-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {payingDeposit ? <Loader2 className="w-4 h-4 animate-spin" /> : <><DollarSign className="w-4 h-4" /> {t.bookingDetail.payDepositBtn} · €{booking.payment?.depositAmount?.toFixed(2) ?? (booking.totalAmount * DEPOSIT_RATE).toFixed(2)}</>}
            </button>
          </div>
        )}

        {/* Approve final price */}
        {isCompleted && priceAdjusted && !priceApproved && (
          <div className="bg-caution-surface border border-caution-edge rounded-panel p-6 shadow-card">
            <div className="flex items-start gap-3 mb-4">
              <Info className="w-5 h-5 text-caution shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-caution">{t.bookingDetail.priceAdjustedTitle}</p>
                <p className="text-sm text-caution mt-0.5 leading-relaxed">
                  {t.bookingDetail.priceAdjustedFrom} <span className="font-bold">€{quotedPrice?.toFixed(2)}</span> {t.bookingDetail.priceAdjustedTo} <span className="font-bold">€{finalPrice?.toFixed(2)}</span>.
                  {' '}{t.bookingDetail.priceAdjustedAction}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleApprovePrice}
                disabled={approvingPrice}
                className="flex-1 bg-brand text-white py-3 rounded-input font-bold text-sm hover:bg-brand-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {approvingPrice ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> {t.bookingDetail.approveBtn} €{finalPrice?.toFixed(2)}</>}
              </button>
              <button
                onClick={() => setReportingIssue(true)}
                className="px-4 py-3 border border-danger-edge text-danger rounded-input font-bold text-sm hover:bg-danger-surface transition-colors"
              >
                {t.bookingDetail.dispute}
              </button>
            </div>
          </div>
        )}

        {priceAdjusted && priceApproved && (
          <div className="flex items-center gap-3 px-4 py-3 bg-trust-surface rounded-card border border-trust-edge">
            <CheckCircle2 className="w-5 h-5 text-trust shrink-0" />
            <p className="text-sm font-medium text-trust">{t.bookingDetail.priceApprovedNotice}</p>
          </div>
        )}

        {/* Provider card */}
        <div className="bg-white rounded-panel border border-border-dim p-6 shadow-card">
          <p className="text-xs font-bold text-ink-dim uppercase tracking-widest mb-4">{t.bookingDetail.yourPro}</p>
          <div className="flex items-start gap-4 mb-4">
            <img
              src={provider?.user?.image || avatarUrl(provider?.user?.name, 150)}
              alt={provider?.user?.name}
              className="w-14 h-14 rounded-card object-cover shrink-0"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="font-bold text-lg">{provider?.user?.name}</span>
                {provider?.isVerified && (
                  <span className="flex items-center gap-1 bg-trust-surface text-trust px-2 py-0.5 rounded-full text-2xs font-bold uppercase">
                    <ShieldCheck className="w-3 h-3" /> {t.common.verified}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-ink-dim">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-brand fill-current" />
                  <span className="font-bold text-ink">{provider?.ratingAvg?.toFixed(1)}</span>
                </span>
                <span>{provider?.completedJobs} {t.meetPros.jobs}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{provider?.responseTime ?? t.bookingDetail.fastReply}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (provider?.phone) {
                  window.location.href = `tel:${provider.phone}`;
                } else {
                  alert(t.bookingDetail.callMasking);
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 border border-border rounded-input text-sm font-bold hover:border-border-dim transition-colors"
            >
              <Phone className="w-4 h-4" /> {t.bookingDetail.call}
            </button>
            {chatUnlocked && (
              <button
                onClick={() => setShowChat(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand text-white rounded-input text-sm font-bold hover:bg-brand-dark transition-colors"
              >
                <MessageSquare className="w-4 h-4" /> {t.bookingDetail.message}
              </button>
            )}
            <Link
              href={`/providers/${provider?.id}`}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-input text-sm font-bold hover:border-border-dim transition-colors"
            >
              {t.common.profile}
            </Link>
          </div>
        </div>

        {/* Booking details */}
        <div className="bg-white rounded-panel border border-border-dim p-6 shadow-card">
          <p className="text-xs font-bold text-ink-dim uppercase tracking-widest mb-4">{t.bookingDetail.bookingDetails}</p>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-ink-sub"><Calendar className="w-4 h-4" /> {t.common.date}</span>
              <span className="font-semibold">{formatVilnius(booking.scheduledAt, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-ink-sub"><Clock className="w-4 h-4" /> {t.common.time}</span>
              <span className="font-semibold">{formatVilnius(booking.scheduledAt, { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {booking.quote?.request?.address && (
              <div className="flex items-start justify-between">
                <span className="flex items-center gap-2 text-ink-sub"><MapPin className="w-4 h-4 shrink-0" /> {t.common.address}</span>
                <span className="font-semibold text-right max-w-[60%]">{booking.quote.request.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-panel border border-border-dim p-6 shadow-card">
          <p className="text-xs font-bold text-ink-dim uppercase tracking-widest mb-4">{t.bookingDetail.paymentTitle}</p>
          <div className="space-y-2 text-sm mb-4">
            {quotedPrice && quotedPrice !== booking.totalAmount && (
              <div className="flex justify-between text-ink-dim">
                <span>{t.bookingDetail.originalQuote}</span>
                <span className="line-through">€{quotedPrice.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-ink-sub">{t.bookingDetail.service}</span>
              <span className="font-semibold">€{booking.totalAmount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border-dim">
              <span className="font-bold">{t.bookingDetail.total}</span>
              <span className="font-bold text-lg">€{booking.totalAmount?.toFixed(2)}</span>
            </div>
          </div>
          {(() => {
            const payStatus = booking.payment?.status;
            const bkCompleted = booking.status === 'COMPLETED';
            // Canonical labels/styles from lib/status-labels, with two local
            // special cases: a completed booking without a settled payment
            // reads as Processing, and no payment record at all reads as
            // awaiting completion.
            const mapped = payStatus ? localizedStatus(t, 'payment', payStatus) : null;
            const info = bkCompleted && (!mapped || payStatus === 'PENDING')
              ? { label: t.statuses.payment.PROCESSING, cls: 'bg-info-surface text-info' }
              : mapped ?? { label: t.bookingDetail.awaitingCompletion, cls: 'bg-surface-alt text-ink-sub' };
            const label = info.label;
            const style = info.cls;
            return (
              <div>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-input text-xs font-bold ${style}`}>
                  <DollarSign className="w-3.5 h-3.5" />
                  {label}
                  {payStatus === 'PAID' && booking.payment?.createdAt && (
                    <span className="font-normal ml-1">· {new Date(booking.payment.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  )}
                </div>
                {payStatus === 'DEPOSIT_HELD' && (
                  <p className="text-2xs text-ink-dim mt-2 leading-relaxed">
                    €{booking.payment?.depositAmount?.toFixed(2)} {t.bookingDetail.depositConfirmedSuffix}
                  </p>
                )}
                {(payStatus === 'PROCESSING' || (bkCompleted && !payStatus)) && (
                  <p className="text-2xs text-ink-dim mt-2 leading-relaxed">
                    {t.bookingDetail.processingNote}
                  </p>
                )}
              </div>
            );
          })()}
          <div className="mt-4 p-3 bg-surface-alt rounded-input border border-border-dim text-xs text-ink-sub leading-relaxed">
            <span className="font-bold text-ink-sub">{t.bookingDetail.cancellationPolicyLabel} </span>
            {t.bookingDetail.cancellationPolicyText}
          </div>
        </div>

        {/* Review section */}
        {isCompleted && (!priceAdjusted || priceApproved) && (
          <div className="bg-white rounded-panel border border-border-dim p-6 shadow-card">
            <p className="text-xs font-bold text-ink-dim uppercase tracking-widest mb-4">{t.bookingDetail.rateExperience}</p>
            {booking.review || reviewSubmitted ? (
              <div className="flex flex-col items-center py-4 text-center">
                <CheckCircle2 className="w-10 h-10 text-trust mb-2" />
                <p className="font-bold">{t.bookingDetail.reviewSubmittedTitle}</p>
                <p className="text-sm text-ink-dim mt-1">{t.bookingDetail.thanksFeedback}</p>
                {booking.review && (
                  <div className="flex items-center gap-1 mt-3">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className={`w-5 h-5 ${i <= booking.review.rating ? 'text-brand fill-current' : 'text-ink-dim'}`} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center gap-2">
                  {[1,2,3,4,5].map(i => (
                    <button
                      key={i}
                      onClick={() => setReview(r => ({ ...r, rating: i }))}
                      className="transition-transform hover:scale-110"
                    >
                      <Star className={`w-8 h-8 transition-colors ${i <= review.rating ? 'text-brand fill-current' : 'text-ink-dim hover:text-brand/50'}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={review.comment}
                  onChange={e => setReview(r => ({ ...r, comment: e.target.value }))}
                  rows={3}
                  placeholder={t.bookingDetail.reviewPlaceholder}
                  className="w-full p-3 bg-surface-alt border border-border-dim rounded-input text-sm outline-none focus:ring-2 focus:ring-brand resize-none"
                />
                <button
                  onClick={submitReview}
                  disabled={!review.rating || submittingReview}
                  className="w-full bg-brand text-white py-3 rounded-input font-bold text-sm hover:bg-brand-dark transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Star className="w-4 h-4" /> {t.bookingDetail.submitReview}</>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Report issue */}
        {!isCanceled && (
          <div className="bg-white rounded-panel border border-border-dim p-6 shadow-card">
            {reportingIssue ? (
              <div>
                <p className="font-bold mb-3 flex items-center gap-2">
                  <LifeBuoy className="w-5 h-5 text-danger" /> {t.bookingDetail.reportIssue}
                </p>
                <textarea
                  value={issueText}
                  onChange={e => setIssueText(e.target.value)}
                  rows={3}
                  placeholder={t.bookingDetail.issuePlaceholder}
                  className="w-full p-3 bg-surface-alt border border-border-dim rounded-input text-sm outline-none focus:ring-2 focus:ring-brand resize-none mb-3"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => { setReportingIssue(false); setIssueText(''); }}
                    className="flex-1 py-3 border border-border rounded-input text-sm font-bold text-ink-sub hover:border-border-dim transition-colors"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    onClick={submitIssue}
                    disabled={!issueText.trim() || submittingIssue}
                    className="flex-1 bg-danger text-white py-3 rounded-input text-sm font-bold hover:opacity-90 transition-colors disabled:opacity-40 flex items-center justify-center"
                  >
                    {submittingIssue ? <Loader2 className="w-4 h-4 animate-spin" /> : t.bookingDetail.submitReport}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LifeBuoy className="w-5 h-5 text-ink-dim" />
                  <div>
                    <p className="font-bold text-sm">{t.bookingDetail.needHelp}</p>
                    <p className="text-xs text-ink-dim">{t.bookingDetail.contactSupport}</p>
                  </div>
                </div>
                <button
                  onClick={() => setReportingIssue(true)}
                  className="flex items-center gap-1 text-sm font-bold text-ink hover:underline"
                >
                  {t.bookingDetail.contact} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cancel confirm modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-panel p-6 w-full max-w-sm">
            <h2 className="font-bold text-lg mb-2">{t.bookingDetail.cancelTitle}</h2>
            <p className="text-sm text-ink-sub mb-6">{t.bookingDetail.cancelDesc}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-3 border border-border rounded-input text-sm font-bold text-ink-sub hover:border-border-dim"
              >
                {t.bookingDetail.keepBooking}
              </button>
              <button
                onClick={handleCancel}
                disabled={actioning}
                className="flex-1 bg-danger text-white py-3 rounded-input text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> : t.bookingDetail.yesCancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom action bar — Mark Complete only exists once the deposit is
          paid (server enforces the same rule with a 409). */}
      {!isCanceled && !isCompleted && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-dim p-4 z-30">
          <div className="max-w-2xl mx-auto flex gap-3">
            <button
              onClick={() => setShowCancelConfirm(true)}
              disabled={actioning}
              className="flex-1 py-3 border border-border rounded-input text-sm font-bold text-ink-sub hover:border-danger-edge hover:text-danger transition-all disabled:opacity-50"
            >
              {t.common.cancel}
            </button>
            {chatUnlocked && (
              <button
                onClick={() => updateStatus('COMPLETED')}
                disabled={actioning}
                className="flex-1 bg-brand text-white py-3 rounded-input text-sm font-bold hover:bg-brand-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> {t.bookingDetail.markComplete}</>}
              </button>
            )}
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}
