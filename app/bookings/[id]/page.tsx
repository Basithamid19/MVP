'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import CustomerLayout from '@/components/CustomerLayout';
import {
  ArrowLeft, Star, MapPin, Calendar,
  Clock, Phone, MessageSquare, CheckCircle2, XCircle,
  Loader2, DollarSign, Timer, LifeBuoy,
  ChevronRight, Info,
} from 'lucide-react';
import ChatPage from '@/components/shared/chat-view';
import {
  Avatar, Button, buttonVariants, DomainStatusBadge, Modal, ModalFooter,
  StatusBadge, statusVariant, useToast,
} from '@/components/ui';
import type { BadgeVariant } from '@/components/ui';
import { cn } from '@/lib/utils';
import { formatVilnius } from '@/lib/time';
import { DEPOSIT_RATE } from '@/lib/fees';
import { localizedStatus } from '@/lib/status-labels';
import { useTranslation } from '@/lib/i18n';
import type { Dictionary } from '@/lib/i18n/types';
import { fetchJsonWithRetry } from '@/lib/fetch-retry';

const STEP_INDEX: Record<string, number> = {
  SCHEDULED: 0,
  IN_PROGRESS: 1,
  COMPLETED: 2,
  CANCELED: -1,
};

/* ─── Status hero tones ─────────────────────────────────────────────────────
 * This page used to stack up to six equal-weight colored banners above the
 * content. Now exactly one state — the highest-precedence one — becomes the
 * hero card (state + single message + primary action) and everything else
 * collapses into a quiet notice list. Transient Stripe outcomes are toasts.
 * ────────────────────────────────────────────────────────────────────────── */

type Tone = 'danger' | 'caution' | 'trust' | 'info' | 'brand';

const TONE_STYLE: Record<Tone, { medallion: string; accent: string; text: string }> = {
  danger:  { medallion: 'bg-danger-surface text-danger',   accent: 'bg-danger',  text: 'text-danger' },
  caution: { medallion: 'bg-caution-surface text-caution', accent: 'bg-caution', text: 'text-caution' },
  trust:   { medallion: 'bg-trust-surface text-trust',     accent: 'bg-trust',   text: 'text-trust' },
  info:    { medallion: 'bg-info-surface text-info',       accent: 'bg-info',    text: 'text-info' },
  brand:   { medallion: 'bg-brand-muted text-brand',       accent: 'bg-brand',   text: 'text-brand' },
};

const VARIANT_TONE: Partial<Record<BadgeVariant, Tone>> = {
  success: 'trust',
  warning: 'caution',
  info:    'info',
  danger:  'danger',
  brand:   'brand',
};

interface Notice {
  key:      string;
  tone:     Tone;
  icon:     React.ElementType;
  title:    string;
  message:  React.ReactNode;
  actions?: React.ReactNode;
}

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
  const { toast } = useToast();

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
        toast.success(t.bookingDetail.issueReported);
      } else {
        const d = await res.json().catch(() => ({} as any));
        toast.error(d.error ?? t.bookingDetail.issueFailed);
      }
    } catch {
      toast.error(t.common.networkError);
    } finally {
      setSubmittingIssue(false);
    }
  };

  const load = useCallback(() => {
    // Retried on cold-start / 5xx. On a failed refresh we keep whatever is
    // already rendered rather than blanking the booking the user is reading.
    fetchJsonWithRetry<any>(`/api/bookings?id=${id}`)
      .then(d => setBooking(d))
      .catch(() => {})
      .finally(() => setLoading(false));
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

  // The Stripe return states are transient — they announce once and get out of
  // the way instead of occupying a permanent slab above the booking.
  const firedCanceled  = useRef(false);
  const firedFinalizing = useRef(false);
  const firedReceived  = useRef(false);

  useEffect(() => {
    if (paymentBanner === 'canceled' && !firedCanceled.current) {
      firedCanceled.current = true;
      toast.info(t.bookingDetail.paymentCanceled);
    }
  }, [paymentBanner, toast, t]);

  useEffect(() => {
    if (paymentBanner !== 'success') return;
    if (paymentConfirmed) {
      if (!firedReceived.current) {
        firedReceived.current = true;
        toast.success(t.bookingDetail.depositReceived);
      }
    } else if (!firedFinalizing.current) {
      firedFinalizing.current = true;
      toast.info(t.bookingDetail.finalizing);
    }
  }, [paymentBanner, paymentConfirmed, toast, t]);

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
        toast.error(d.error ?? t.bookingDetail.updateFailed);
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
        toast.error(data.error ?? t.bookingDetail.checkoutFailed);
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

  const depositLabel = booking.payment?.depositAmount?.toFixed(2) ?? (booking.totalAmount * DEPOSIT_RATE).toFixed(2);

  /* ── Notice precedence ─────────────────────────────────────────────────
   * canceled > deposit required > price adjusted (needs a decision) >
   * price approved. The first becomes the hero; the rest become quiet rows.
   * (Stripe success/canceled are transient → toasts, above.) */
  const notices: Notice[] = [];

  if (isCanceled) {
    notices.push({
      key: 'canceled',
      tone: 'danger',
      icon: XCircle,
      // The status badge already says "Canceled" — don't say it twice.
      title: '',
      message: t.bookingDetail.canceledNotice,
    });
  }

  if (!isCanceled && booking.payment?.status === 'PENDING') {
    notices.push({
      key: 'deposit',
      tone: 'caution',
      icon: Info,
      title: t.bookingDetail.depositRequiredTitle,
      message: (
        <>
          {t.bookingDetail.depositPayPrefix} <span className="font-bold text-ink">€{depositLabel} {t.bookingDetail.depositBold}</span> {t.bookingDetail.depositPaySuffix}
        </>
      ),
      actions: (
        <Button
          onClick={handlePayDeposit}
          loading={payingDeposit}
          size="lg"
          className="w-full sm:w-auto"
        >
          {!payingDeposit && <DollarSign className="w-4 h-4" />}
          {t.bookingDetail.payDepositBtn} · €{depositLabel}
        </Button>
      ),
    });
  }

  if (isCompleted && priceAdjusted && !priceApproved) {
    notices.push({
      key: 'price-decision',
      tone: 'caution',
      icon: Info,
      title: t.bookingDetail.priceAdjustedTitle,
      message: (
        <>
          {t.bookingDetail.priceAdjustedFrom} <span className="font-bold text-ink">€{quotedPrice?.toFixed(2)}</span> {t.bookingDetail.priceAdjustedTo} <span className="font-bold text-ink">€{finalPrice?.toFixed(2)}</span>.
          {' '}{t.bookingDetail.priceAdjustedAction}
        </>
      ),
      actions: (
        <>
          <Button onClick={handleApprovePrice} loading={approvingPrice} size="lg" className="flex-1">
            {!approvingPrice && <CheckCircle2 className="w-4 h-4" />}
            {t.bookingDetail.approveBtn} €{finalPrice?.toFixed(2)}
          </Button>
          <Button variant="danger" size="lg" onClick={() => setReportingIssue(true)}>
            {t.bookingDetail.dispute}
          </Button>
        </>
      ),
    });
  }

  if (priceAdjusted && priceApproved) {
    notices.push({
      key: 'price-approved',
      tone: 'trust',
      icon: CheckCircle2,
      title: t.bookingDetail.priceApprovedNotice,
      message: null,
    });
  }

  // No outstanding notice → a calm hero that just states where the job is.
  const DEFAULT_ICON: Record<string, React.ElementType> = {
    SCHEDULED: Calendar,
    IN_PROGRESS: Timer,
    COMPLETED: CheckCircle2,
    CANCELED: XCircle,
  };
  const DEFAULT_MESSAGE: Record<string, string> = {
    SCHEDULED: t.bookingDetail.heroScheduled,
    IN_PROGRESS: t.bookingDetail.heroInProgress,
    COMPLETED: t.bookingDetail.heroCompleted,
    CANCELED: t.bookingDetail.canceledNotice,
  };

  const hero: Notice = notices[0] ?? {
    key: 'status',
    tone: VARIANT_TONE[statusVariant('booking', booking.status)] ?? 'brand',
    icon: DEFAULT_ICON[booking.status] ?? Calendar,
    title: '',
    message: DEFAULT_MESSAGE[booking.status] ?? '',
  };
  const secondary = notices.slice(1);
  const heroTone = TONE_STYLE[hero.tone];
  const HeroIcon = hero.icon;

  return (
    <CustomerLayout maxWidth="max-w-2xl">
      {/* Back row */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 hover:bg-surface-alt rounded-full transition-colors text-ink-sub hover:text-ink"
          aria-label={t.common.back}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs text-ink-dim">{t.common.back}</span>
      </div>

      <div className="space-y-5 pb-24">
        {/* ── Status hero: one card, one message, one primary action ── */}
        <div className="relative bg-card rounded-panel border border-border-dim shadow-card overflow-hidden">
          <span className={cn('absolute inset-y-0 left-0 w-1', heroTone.accent)} aria-hidden="true" />
          <div className="p-5 sm:p-6 pl-6 sm:pl-7">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-ink truncate">
                  {category?.name ?? t.bookingDetail.bookingFallback}
                </h1>
                <p className="text-2xs text-ink-dim font-medium mt-0.5">ID: {booking.id.slice(0, 8)}…</p>
              </div>
              <DomainStatusBadge kind="booking" status={booking.status} dict={t} className="shrink-0" />
            </div>

            <div className="flex items-start gap-3 mt-4">
              <div className={cn('w-10 h-10 rounded-card flex items-center justify-center shrink-0', heroTone.medallion)}>
                <HeroIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                {hero.title && <p className="font-bold text-sm text-ink">{hero.title}</p>}
                {hero.message && (
                  <p className="text-sm text-ink-sub leading-relaxed mt-0.5">{hero.message}</p>
                )}
                {!hero.title && !hero.message && eta && (
                  <p className="text-sm text-ink-sub leading-relaxed">{eta}</p>
                )}
              </div>
            </div>

            {hero.actions && (
              <div className="flex flex-col sm:flex-row gap-3 mt-4">{hero.actions}</div>
            )}
          </div>
        </div>

        {/* ── Secondary notices: quiet stacked list, no color slabs ── */}
        {secondary.length > 0 && (
          <div className="bg-card rounded-card border border-border-dim p-4 space-y-3">
            {secondary.map(n => {
              const NoticeIcon = n.icon;
              return (
                <div key={n.key}>
                  <div className="flex items-start gap-2.5">
                    <NoticeIcon className={cn('w-4 h-4 shrink-0 mt-0.5', TONE_STYLE[n.tone].text)} />
                    <p className="text-sm text-ink-sub leading-relaxed">
                      {n.title && <span className="font-semibold text-ink">{n.title}</span>}
                      {n.title && n.message ? ' — ' : null}
                      {n.message}
                    </p>
                  </div>
                  {n.actions && <div className="flex gap-2 mt-2.5 pl-6">{n.actions}</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* Status timeline */}
        {!isCanceled && (
          <div className="bg-card rounded-panel border border-border-dim p-6 shadow-card">
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

        {/* Provider card */}
        <div className="bg-card rounded-panel border border-border-dim p-6 shadow-card">
          <p className="text-xs font-bold text-ink-dim uppercase tracking-widest mb-4">{t.bookingDetail.yourPro}</p>
          <div className="flex items-start gap-4 mb-4">
            <Avatar
              src={provider?.user?.image}
              name={provider?.user?.name ?? ''}
              size="lg"
              shape="square"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="font-bold text-lg">{provider?.user?.name}</span>
                {provider?.isVerified && (
                  <StatusBadge variant="success" label={t.common.verified} />
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
            <Button
              variant="secondary"
              size="lg"
              className="flex-1"
              onClick={() => {
                if (provider?.phone) {
                  window.location.href = `tel:${provider.phone}`;
                } else {
                  toast.info(t.bookingDetail.callMasking);
                }
              }}
            >
              <Phone className="w-4 h-4" /> {t.bookingDetail.call}
            </Button>
            {chatUnlocked && (
              <Button size="lg" className="flex-1" onClick={() => setShowChat(true)}>
                <MessageSquare className="w-4 h-4" /> {t.bookingDetail.message}
              </Button>
            )}
            <Link
              href={`/providers/${provider?.id}`}
              className={buttonVariants({ variant: 'secondary', size: 'lg' })}
            >
              {t.common.profile}
            </Link>
          </div>
        </div>

        {/* Booking details */}
        <div className="bg-card rounded-panel border border-border-dim p-6 shadow-card">
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
        <div className="bg-card rounded-panel border border-border-dim p-6 shadow-card">
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
          <div className="bg-card rounded-panel border border-border-dim p-6 shadow-card">
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
                <Button
                  onClick={submitReview}
                  disabled={!review.rating}
                  loading={submittingReview}
                  size="lg"
                  className="w-full"
                >
                  {!submittingReview && <Star className="w-4 h-4" />}
                  {t.bookingDetail.submitReview}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Report issue */}
        {!isCanceled && (
          <div className="bg-card rounded-panel border border-border-dim p-6 shadow-card">
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
                  <Button
                    variant="secondary"
                    size="lg"
                    className="flex-1"
                    onClick={() => { setReportingIssue(false); setIssueText(''); }}
                  >
                    {t.common.cancel}
                  </Button>
                  <Button
                    variant="danger"
                    size="lg"
                    className="flex-1"
                    onClick={submitIssue}
                    disabled={!issueText.trim()}
                    loading={submittingIssue}
                  >
                    {t.bookingDetail.submitReport}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <LifeBuoy className="w-5 h-5 text-ink-dim shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-sm">{t.bookingDetail.needHelp}</p>
                    <p className="text-xs text-ink-dim">{t.bookingDetail.contactSupport}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setReportingIssue(true)}>
                  {t.bookingDetail.contact} <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cancel confirm modal */}
      <Modal
        open={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        title={t.bookingDetail.cancelTitle}
        description={t.bookingDetail.cancelDesc}
        size="sm"
        footer={
          <ModalFooter>
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => setShowCancelConfirm(false)}>
              {t.bookingDetail.keepBooking}
            </Button>
            <Button variant="danger" size="lg" className="flex-1" onClick={handleCancel} loading={actioning}>
              {t.bookingDetail.yesCancel}
            </Button>
          </ModalFooter>
        }
      />

      {/* Bottom action bar — Mark Complete only exists once the deposit is
          paid (server enforces the same rule with a 409). */}
      {!isCanceled && !isCompleted && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border-dim p-4 z-30">
          <div className="max-w-2xl mx-auto flex gap-3">
            <Button
              variant="secondary"
              size="lg"
              className="flex-1"
              onClick={() => setShowCancelConfirm(true)}
              disabled={actioning}
            >
              {t.common.cancel}
            </Button>
            {chatUnlocked && (
              <Button
                size="lg"
                className="flex-1"
                onClick={() => updateStatus('COMPLETED')}
                loading={actioning}
              >
                {!actioning && <CheckCircle2 className="w-4 h-4" />}
                {t.bookingDetail.markComplete}
              </Button>
            )}
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}
