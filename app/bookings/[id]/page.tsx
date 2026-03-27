'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

const BOOKING_STEPS = ['Scheduled', 'In Progress', 'Completed'];

const STEP_INDEX: Record<string, number> = {
  SCHEDULED: 0,
  IN_PROGRESS: 1,
  COMPLETED: 2,
  CANCELED: -1,
};

function deriveEta(booking: any): string | null {
  if (!booking) return null;
  if (booking.status === 'COMPLETED' || booking.status === 'CANCELED') return null;
  if (booking.status === 'IN_PROGRESS') return 'En route / On site';
  const scheduled = new Date(booking.scheduledAt);
  const now = new Date();
  const diffMs = scheduled.getTime() - now.getTime();
  if (diffMs <= 0) return 'Arriving soon';
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffM = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (diffH > 24) {
    return `In ${Math.floor(diffH / 24)} day${Math.floor(diffH / 24) > 1 ? 's' : ''}`;
  }
  if (diffH > 0) return `In ~${diffH}h ${diffM}m`;
  return `In ~${diffM} min`;
}

export default function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [review, setReview] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [approvingPrice, setApprovingPrice] = useState(false);
  const [priceApproved, setPriceApproved] = useState(false);
  const [reportingIssue, setReportingIssue] = useState(false);
  const [issueText, setIssueText] = useState('');

  const load = useCallback(() => {
    fetch(`/api/bookings?id=${id}`)
      .then(r => r.json())
      .then(d => { setBooking(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (status: string) => {
    setActioning(true);
    try {
      await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: id, status }),
      });
      load();
    } finally {
      setActioning(false);
      setShowCancelConfirm(false);
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
        <p className="text-xl font-bold mb-2">Booking not found</p>
        <Link href="/dashboard" className="text-brand font-bold hover:underline">Back to dashboard</Link>
      </div>
    );
  }

  if (showChat) {
    return (
      <ChatPage
        threadId={booking.chatThread?.id ?? booking.id}
        booking={booking}
      />
    );
  }

  const provider = booking.provider;
  const category = booking.quote?.request?.category;
  const stepIdx = STEP_INDEX[booking.status] ?? 0;
  const isCanceled = booking.status === 'CANCELED';
  const isCompleted = booking.status === 'COMPLETED';
  const eta = deriveEta(booking);
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
          <h1 className="font-bold text-lg">{category?.name ?? 'Booking'}</h1>
          <p className="text-xs text-ink-dim">ID: {booking.id.slice(0, 8)}…</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
          isCanceled ? 'bg-danger-surface text-danger' :
          isCompleted ? 'bg-trust-surface text-trust' :
          booking.status === 'IN_PROGRESS' ? 'bg-caution-surface text-caution' :
          'bg-info-surface text-info'
        }`}>
          {booking.status.replace('_', ' ')}
        </span>
      </div>

      <div className="space-y-5 pb-24">
        {/* Status timeline */}
        {!isCanceled && (
          <div className="bg-white rounded-panel border border-border-dim p-6 shadow-card">
            <p className="text-xs font-bold text-ink-dim uppercase tracking-widest mb-4">Job Progress</p>
            <div className="flex items-center mb-4">
              {BOOKING_STEPS.map((s, i) => (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      i <= stepIdx ? 'bg-brand text-white' : 'bg-surface-alt text-ink-dim'
                    }`}>
                      {i < stepIdx ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                    </div>
                    <span className={`text-[11px] font-bold mt-1 ${i === stepIdx ? 'text-ink' : 'text-ink-dim'}`}>{s}</span>
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
                  <p className="text-sm font-bold text-info">Provider ETA</p>
                  <p className="text-xs text-info">{eta}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {isCanceled && (
          <div className="bg-danger-surface border border-danger-edge rounded-card p-4 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-danger shrink-0" />
            <p className="text-sm font-medium text-danger">This booking has been canceled.</p>
          </div>
        )}

        {/* Approve final price */}
        {isCompleted && priceAdjusted && !priceApproved && (
          <div className="bg-caution-surface border border-caution-edge rounded-panel p-6 shadow-card">
            <div className="flex items-start gap-3 mb-4">
              <Info className="w-5 h-5 text-caution shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-caution">Final price adjusted</p>
                <p className="text-sm text-caution mt-0.5 leading-relaxed">
                  The pro adjusted the final price from <span className="font-bold">€{quotedPrice?.toFixed(2)}</span> to <span className="font-bold">€{finalPrice?.toFixed(2)}</span>.
                  Please approve or dispute before leaving a review.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleApprovePrice}
                disabled={approvingPrice}
                className="flex-1 bg-brand text-white py-3 rounded-input font-bold text-sm hover:bg-brand-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {approvingPrice ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Approve €{finalPrice?.toFixed(2)}</>}
              </button>
              <button
                onClick={() => setReportingIssue(true)}
                className="px-4 py-3 border border-danger-edge text-danger rounded-input font-bold text-sm hover:bg-danger-surface transition-colors"
              >
                Dispute
              </button>
            </div>
          </div>
        )}

        {priceAdjusted && priceApproved && (
          <div className="flex items-center gap-3 px-4 py-3 bg-trust-surface rounded-card border border-trust-edge">
            <CheckCircle2 className="w-5 h-5 text-trust shrink-0" />
            <p className="text-sm font-medium text-trust">Final price approved. Thank you!</p>
          </div>
        )}

        {/* Provider card */}
        <div className="bg-white rounded-panel border border-border-dim p-6 shadow-card">
          <p className="text-xs font-bold text-ink-dim uppercase tracking-widest mb-4">Your Pro</p>
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
                  <span className="flex items-center gap-1 bg-trust-surface text-trust px-2 py-0.5 rounded-full text-[11px] font-bold uppercase">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-ink-dim">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-brand fill-current" />
                  <span className="font-bold text-ink">{provider?.ratingAvg?.toFixed(1)}</span>
                </span>
                <span>{provider?.completedJobs} jobs</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{provider?.responseTime ?? 'Fast reply'}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (provider?.phone) {
                  window.location.href = `tel:${provider.phone}`;
                } else {
                  alert('Call masking active. Your call will be connected securely through Aladdin.');
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 border border-border rounded-input text-sm font-bold hover:border-border-dim transition-colors"
            >
              <Phone className="w-4 h-4" /> Call
            </button>
            <button
              onClick={() => setShowChat(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand text-white rounded-input text-sm font-bold hover:bg-brand-dark transition-colors"
            >
              <MessageSquare className="w-4 h-4" /> Message
            </button>
            <Link
              href={`/providers/${provider?.id}`}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-input text-sm font-bold hover:border-border-dim transition-colors"
            >
              Profile
            </Link>
          </div>
        </div>

        {/* Booking details */}
        <div className="bg-white rounded-panel border border-border-dim p-6 shadow-card">
          <p className="text-xs font-bold text-ink-dim uppercase tracking-widest mb-4">Booking Details</p>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-ink-sub"><Calendar className="w-4 h-4" /> Date</span>
              <span className="font-semibold">{new Date(booking.scheduledAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-ink-sub"><Clock className="w-4 h-4" /> Time</span>
              <span className="font-semibold">{new Date(booking.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {booking.quote?.request?.address && (
              <div className="flex items-start justify-between">
                <span className="flex items-center gap-2 text-ink-sub"><MapPin className="w-4 h-4 shrink-0" /> Address</span>
                <span className="font-semibold text-right max-w-[60%]">{booking.quote.request.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-panel border border-border-dim p-6 shadow-card">
          <p className="text-xs font-bold text-ink-dim uppercase tracking-widest mb-4">Payment</p>
          <div className="space-y-2 text-sm mb-4">
            {quotedPrice && (
              <div className="flex justify-between text-ink-dim">
                <span>Quoted price</span>
                <span>€{quotedPrice.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-ink-sub">Service fee</span>
              <span className="font-semibold">€{(booking.totalAmount * 0.88).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-sub">Platform fee (12%)</span>
              <span className="font-semibold">€{(booking.totalAmount * 0.12).toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border-dim">
              <span className="font-bold">Total</span>
              <span className="font-bold text-lg">€{booking.totalAmount?.toFixed(2)}</span>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-input text-xs font-bold ${
            booking.payment?.status === 'PAID' ? 'bg-trust-surface text-trust' :
            booking.payment?.status === 'REFUNDED' ? 'bg-surface-alt text-ink-sub' :
            'bg-caution-surface text-caution'
          }`}>
            <DollarSign className="w-3.5 h-3.5" />
            {booking.payment?.status ?? 'Payment pending'}
          </div>
          <div className="mt-4 p-3 bg-surface-alt rounded-input border border-border-dim text-xs text-ink-sub leading-relaxed">
            <span className="font-bold text-ink-sub">Cancellation policy: </span>
            Free cancellation up to 24h before the scheduled time. Late cancellations may incur a fee of up to €10.
          </div>
        </div>

        {/* Review section */}
        {isCompleted && (!priceAdjusted || priceApproved) && (
          <div className="bg-white rounded-panel border border-border-dim p-6 shadow-card">
            <p className="text-xs font-bold text-ink-dim uppercase tracking-widest mb-4">Rate your experience</p>
            {booking.review || reviewSubmitted ? (
              <div className="flex flex-col items-center py-4 text-center">
                <CheckCircle2 className="w-10 h-10 text-trust mb-2" />
                <p className="font-bold">Review submitted!</p>
                <p className="text-sm text-ink-dim mt-1">Thank you for your feedback.</p>
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
                  placeholder="Tell others about your experience (optional)..."
                  className="w-full p-3 bg-surface-alt border border-border-dim rounded-input text-sm outline-none focus:ring-2 focus:ring-brand resize-none"
                />
                <button
                  onClick={submitReview}
                  disabled={!review.rating || submittingReview}
                  className="w-full bg-brand text-white py-3 rounded-input font-bold text-sm hover:bg-brand-dark transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Star className="w-4 h-4" /> Submit Review</>}
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
                  <LifeBuoy className="w-5 h-5 text-danger" /> Report an issue
                </p>
                <textarea
                  value={issueText}
                  onChange={e => setIssueText(e.target.value)}
                  rows={3}
                  placeholder="Describe the issue (e.g. price dispute, no-show, quality concern)..."
                  className="w-full p-3 bg-surface-alt border border-border-dim rounded-input text-sm outline-none focus:ring-2 focus:ring-brand resize-none mb-3"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => { setReportingIssue(false); setIssueText(''); }}
                    className="flex-1 py-3 border border-border rounded-input text-sm font-bold text-ink-sub hover:border-border-dim transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { setReportingIssue(false); alert('Issue reported. Our support team will be in touch within 24 hours.'); }}
                    disabled={!issueText.trim()}
                    className="flex-1 bg-danger text-white py-3 rounded-input text-sm font-bold hover:opacity-90 transition-colors disabled:opacity-40"
                  >
                    Submit Report
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LifeBuoy className="w-5 h-5 text-ink-dim" />
                  <div>
                    <p className="font-bold text-sm">Need help?</p>
                    <p className="text-xs text-ink-dim">Contact support or report an issue</p>
                  </div>
                </div>
                <button
                  onClick={() => setReportingIssue(true)}
                  className="flex items-center gap-1 text-sm font-bold text-ink hover:underline"
                >
                  Contact <ChevronRight className="w-4 h-4" />
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
            <h2 className="font-bold text-lg mb-2">Cancel booking?</h2>
            <p className="text-sm text-ink-sub mb-6">This action cannot be undone. Cancellation fees may apply if within 24 hours of the appointment.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-3 border border-border rounded-input text-sm font-bold text-ink-sub hover:border-border-dim"
              >
                Keep booking
              </button>
              <button
                onClick={() => updateStatus('CANCELED')}
                disabled={actioning}
                className="flex-1 bg-danger text-white py-3 rounded-input text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom action bar */}
      {!isCanceled && !isCompleted && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-dim p-4 z-30">
          <div className="max-w-2xl mx-auto flex gap-3">
            <button
              onClick={() => setShowCancelConfirm(true)}
              disabled={actioning}
              className="flex-1 py-3 border border-border rounded-input text-sm font-bold text-ink-sub hover:border-danger-edge hover:text-danger transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => updateStatus('COMPLETED')}
              disabled={actioning}
              className="flex-1 bg-brand text-white py-3 rounded-input text-sm font-bold hover:bg-brand-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Mark Complete</>}
            </button>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}
