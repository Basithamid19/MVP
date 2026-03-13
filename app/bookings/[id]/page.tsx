'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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

// Derive an ETA string based on booking status and scheduled time
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4">
        <p className="text-xl font-bold mb-2">Booking not found</p>
        <Link href="/dashboard" className="text-black font-bold underline">Back to dashboard</Link>
      </div>
    );
  }

  // Show chat overlay if active
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

  // Detect if final price differs from quoted price
  const quotedPrice = booking.quote?.price;
  const finalPrice = booking.totalAmount;
  const priceAdjusted = quotedPrice && finalPrice && Math.abs(finalPrice - quotedPrice) > 0.01;

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-sm">{category?.name ?? 'Booking'}</h1>
            <p className="text-xs text-gray-400">ID: {booking.id.slice(0, 8)}…</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
            isCanceled ? 'bg-red-100 text-red-600' :
            isCompleted ? 'bg-green-100 text-green-700' :
            booking.status === 'IN_PROGRESS' ? 'bg-orange-100 text-orange-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {booking.status.replace('_', ' ')}
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Status timeline */}
        {!isCanceled && (
          <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Job Progress</p>
            <div className="flex items-center mb-4">
              {BOOKING_STEPS.map((s, i) => (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      i <= stepIdx ? 'bg-black text-white' : 'bg-gray-100 text-gray-300'
                    }`}>
                      {i < stepIdx ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                    </div>
                    <span className={`text-[10px] font-bold mt-1 ${i === stepIdx ? 'text-black' : 'text-gray-300'}`}>{s}</span>
                  </div>
                  {i < BOOKING_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mb-4 ${i < stepIdx ? 'bg-black' : 'bg-gray-100'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
            {/* Provider ETA */}
            {eta && (
              <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-2xl border border-blue-100">
                <Timer className="w-5 h-5 text-blue-500 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-blue-900">Provider ETA</p>
                  <p className="text-xs text-blue-700">{eta}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {isCanceled && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm font-medium text-red-800">This booking has been canceled.</p>
          </div>
        )}

        {/* Approve final price (if adjusted) */}
        {isCompleted && priceAdjusted && !priceApproved && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900">Final price adjusted</p>
                <p className="text-sm text-amber-700 mt-0.5 leading-relaxed">
                  The pro adjusted the final price from <span className="font-bold">€{quotedPrice?.toFixed(2)}</span> to <span className="font-bold">€{finalPrice?.toFixed(2)}</span>. 
                  Please approve or dispute before leaving a review.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleApprovePrice}
                disabled={approvingPrice}
                className="flex-1 bg-black text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {approvingPrice ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Approve €{finalPrice?.toFixed(2)}</>}
              </button>
              <button
                onClick={() => setReportingIssue(true)}
                className="px-4 py-3 border border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors"
              >
                Dispute
              </button>
            </div>
          </div>
        )}

        {priceAdjusted && priceApproved && (
          <div className="flex items-center gap-3 px-4 py-3 bg-green-50 rounded-2xl border border-green-100">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <p className="text-sm font-medium text-green-800">Final price approved. Thank you!</p>
          </div>
        )}

        {/* Provider card */}
        <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Your Pro</p>
          <div className="flex items-start gap-4 mb-4">
            <img
              src={provider?.user?.image || `https://i.pravatar.cc/80?u=${provider?.id}`}
              alt={provider?.user?.name}
              className="w-14 h-14 rounded-2xl object-cover shrink-0"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="font-bold text-lg">{provider?.user?.name}</span>
                {provider?.isVerified && (
                  <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold text-black">{provider?.ratingAvg?.toFixed(1)}</span>
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
                  alert('Call masking active. Your call will be connected securely through VilniusPro.');
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl text-sm font-bold hover:border-gray-400 transition-colors"
            >
              <Phone className="w-4 h-4" /> Call
            </button>
            <button
              onClick={() => setShowChat(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors"
            >
              <MessageSquare className="w-4 h-4" /> Message
            </button>
            <Link
              href={`/providers/${provider?.id}`}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold hover:border-gray-400 transition-colors"
            >
              Profile
            </Link>
          </div>
        </div>

        {/* Booking details */}
        <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Booking Details</p>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-gray-500"><Calendar className="w-4 h-4" /> Date</span>
              <span className="font-semibold">{new Date(booking.scheduledAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-gray-500"><Clock className="w-4 h-4" /> Time</span>
              <span className="font-semibold">{new Date(booking.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {booking.quote?.request?.address && (
              <div className="flex items-start justify-between">
                <span className="flex items-center gap-2 text-gray-500"><MapPin className="w-4 h-4 shrink-0" /> Address</span>
                <span className="font-semibold text-right max-w-[60%]">{booking.quote.request.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment + fee breakdown */}
        <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Payment</p>
          <div className="space-y-2 text-sm mb-4">
            {quotedPrice && (
              <div className="flex justify-between text-gray-400">
                <span>Quoted price</span>
                <span>€{quotedPrice.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Service fee</span>
              <span className="font-semibold">€{(booking.totalAmount * 0.88).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Platform fee (12%)</span>
              <span className="font-semibold">€{(booking.totalAmount * 0.12).toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-50">
              <span className="font-bold">Total</span>
              <span className="font-bold text-lg">€{booking.totalAmount?.toFixed(2)}</span>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${
            booking.payment?.status === 'PAID' ? 'bg-green-50 text-green-700' :
            booking.payment?.status === 'REFUNDED' ? 'bg-gray-100 text-gray-500' :
            'bg-yellow-50 text-yellow-700'
          }`}>
            <DollarSign className="w-3.5 h-3.5" />
            {booking.payment?.status ?? 'Payment pending'}
          </div>

          {/* Cancellation policy */}
          <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500 leading-relaxed">
            <span className="font-bold text-gray-700">Cancellation policy: </span>
            Free cancellation up to 24h before the scheduled time. Late cancellations may incur a fee of up to €10.
          </div>
        </div>

        {/* Review section */}
        {isCompleted && (!priceAdjusted || priceApproved) && (
          <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Rate your experience</p>
            {booking.review || reviewSubmitted ? (
              <div className="flex flex-col items-center py-4 text-center">
                <CheckCircle2 className="w-10 h-10 text-green-500 mb-2" />
                <p className="font-bold">Review submitted!</p>
                <p className="text-sm text-gray-400 mt-1">Thank you for your feedback.</p>
                {booking.review && (
                  <div className="flex items-center gap-1 mt-3">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className={`w-5 h-5 ${i <= booking.review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
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
                      <Star className={`w-8 h-8 transition-colors ${i <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 hover:text-yellow-300'}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={review.comment}
                  onChange={e => setReview(r => ({ ...r, comment: e.target.value }))}
                  rows={3}
                  placeholder="Tell others about your experience (optional)..."
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black resize-none"
                />
                <button
                  onClick={submitReview}
                  disabled={!review.rating || submittingReview}
                  className="w-full bg-black text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Star className="w-4 h-4" /> Submit Review</>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Report issue */}
        {!isCanceled && (
          <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
            {reportingIssue ? (
              <div>
                <p className="font-bold mb-3 flex items-center gap-2">
                  <LifeBuoy className="w-5 h-5 text-red-500" /> Report an issue
                </p>
                <textarea
                  value={issueText}
                  onChange={e => setIssueText(e.target.value)}
                  rows={3}
                  placeholder="Describe the issue (e.g. price dispute, no-show, quality concern)..."
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black resize-none mb-3"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => { setReportingIssue(false); setIssueText(''); }}
                    className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:border-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { setReportingIssue(false); alert('Issue reported. Our support team will be in touch within 24 hours.'); }}
                    disabled={!issueText.trim()}
                    className="flex-1 bg-red-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-40"
                  >
                    Submit Report
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LifeBuoy className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-bold text-sm">Need help?</p>
                    <p className="text-xs text-gray-400">Contact support or report an issue</p>
                  </div>
                </div>
                <button
                  onClick={() => setReportingIssue(true)}
                  className="flex items-center gap-1 text-sm font-bold text-black hover:underline"
                >
                  Contact <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Cancel confirm modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <h2 className="font-bold text-lg mb-2">Cancel booking?</h2>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone. Cancellation fees may apply if within 24 hours of the appointment.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:border-gray-400"
              >
                Keep booking
              </button>
              <button
                onClick={() => updateStatus('CANCELED')}
                disabled={actioning}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom action bar */}
      {!isCanceled && !isCompleted && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
          <div className="max-w-2xl mx-auto flex gap-3">
            <button
              onClick={() => setShowCancelConfirm(true)}
              disabled={actioning}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:border-red-200 hover:text-red-600 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => updateStatus('COMPLETED')}
              disabled={actioning}
              className="flex-1 bg-black text-white py-3 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Mark Complete</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
