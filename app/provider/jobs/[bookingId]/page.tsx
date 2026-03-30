'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, Phone, MessageSquare, CheckCircle2,
  Circle, Camera, Loader2, Navigation, Clock, X,
  ImagePlus, AlertTriangle, DollarSign, Timer, ChevronRight,
} from 'lucide-react';
import ChatPage from '@/components/shared/chat-view';

const STATUS_FLOW: Record<string, { next: string; label: string; nextLabel: string; color: string }> = {
  SCHEDULED:   { next: 'IN_PROGRESS', label: 'Scheduled',   nextLabel: 'Mark Arrived / Start Job', color: 'bg-info-surface text-info' },
  IN_PROGRESS: { next: 'COMPLETED',   label: 'In Progress', nextLabel: 'Mark Complete',            color: 'bg-caution-surface text-caution' },
  COMPLETED:   { next: '',            label: 'Completed',   nextLabel: '',                          color: 'bg-trust-surface text-trust' },
  CANCELED:    { next: '',            label: 'Canceled',    nextLabel: '',                          color: 'bg-danger-surface text-danger' },
};

const DEFAULT_CHECKLIST = [
  'Confirm address and access with customer',
  'Inspect scope of work on arrival',
  'Take before photos',
  'Complete the job',
  'Clean up the work area',
  'Take after photos',
  'Confirm completion with customer',
];

export default function ProviderJobDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [checklist, setChecklist] = useState<boolean[]>(DEFAULT_CHECKLIST.map(() => false));
  const [photos, setPhotos] = useState<{ preview: string; label: string }[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    fetch(`/api/bookings?id=${bookingId}`)
      .then(r => r.json())
      .then(d => { setBooking(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [bookingId]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (status: string) => {
    setActioning(true);
    try {
      await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status }),
      });
      load();
    } finally {
      setActioning(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/uploads', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        setPhotos(prev => [...prev, { preview: data.url, label: file.name }]);
      }
    } finally {
      setUploadingPhoto(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-ink-dim" /></div>;
  if (!booking) return <div className="p-8 text-center"><p className="text-ink-dim">Booking not found.</p></div>;

  if (showChat) {
    return <ChatPage threadId={booking.chatThread?.id ?? booking.id} booking={booking} />;
  }

  const customer = booking.customer;
  const flow = STATUS_FLOW[booking.status] ?? STATUS_FLOW.SCHEDULED;
  const isCanceled = booking.status === 'CANCELED';
  const isCompleted = booking.status === 'COMPLETED';
  const address = booking.quote?.request?.address;
  const mapsUrl = address ? `https://maps.google.com/?q=${encodeURIComponent(address)}` : '#';
  const completedTasks = checklist.filter(Boolean).length;
  const earnings = (booking.totalAmount * 0.88).toFixed(2);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto pb-28">

      {/* ── Mobile: Unified header ── */}
      <div className="sm:hidden">
        {/* Back row */}
        <div className="flex items-center gap-2 mb-3">
          <Link href="/provider/jobs" className="p-1.5 -ml-1.5 hover:bg-surface-alt rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-ink-sub" />
          </Link>
          <span className="text-xs text-ink-dim">Back to jobs</span>
        </div>

        {/* Title + status + earnings hero */}
        <div className="bg-white rounded-2xl border border-border-dim shadow-sm p-4 mb-3">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-ink tracking-tight">{booking.quote?.request?.category?.name ?? 'Job'}</h1>
              <p className="text-[10px] text-ink-dim mt-0.5 font-medium">ID: {booking.id.slice(0, 8)}…</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0 ${flow.color}`}>
              {flow.label}
            </span>
          </div>

          {/* Key details strip */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border-dim">
            <div>
              <p className="text-[9px] font-bold text-ink-dim uppercase tracking-widest mb-0.5">Earnings</p>
              <p className="text-base font-bold text-trust">€{earnings}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-ink-dim uppercase tracking-widest mb-0.5">Scheduled</p>
              <p className="text-xs font-semibold text-ink">
                {new Date(booking.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </p>
              <p className="text-[10px] text-ink-dim">
                {new Date(booking.scheduledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {booking.quote?.estimatedHours && (
              <div>
                <p className="text-[9px] font-bold text-ink-dim uppercase tracking-widest mb-0.5">Duration</p>
                <p className="text-xs font-semibold text-ink">~{booking.quote.estimatedHours}h</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Desktop: Original header ── */}
      <div className="hidden sm:flex items-center gap-3 mb-6">
        <Link href="/provider/jobs" className="p-2 hover:bg-surface-alt rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="font-bold">{booking.quote?.request?.category?.name ?? 'Job'}</h1>
          <p className="text-xs text-ink-dim">ID: {booking.id.slice(0, 8)}…</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${flow.color}`}>
          {flow.label}
        </span>
      </div>

      <div className="space-y-3 sm:space-y-5">

        {/* ── Mobile: Customer compact card ── */}
        <div className="sm:hidden bg-white rounded-2xl border border-border-dim shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 p-3.5">
            <img
              src={customer?.user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer?.user?.name ?? 'User')}&size=160&background=cdd9d0&color=1c3828&bold=true&rounded=true`}
              alt={customer?.user?.name}
              className="w-10 h-10 rounded-xl object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-ink">{customer?.user?.name}</p>
              {address && (
                <p className="text-[11px] text-ink-dim flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-3 h-3 shrink-0" /> {address}
                </p>
              )}
            </div>
          </div>
          {/* Action row */}
          <div className="border-t border-border-dim grid grid-cols-3 divide-x divide-border-dim">
            <button onClick={() => setShowChat(true)}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-brand text-white text-xs font-semibold">
              <MessageSquare className="w-3.5 h-3.5" /> Message
            </button>
            <button
              onClick={() => {
                const phone = customer?.phone;
                if (phone) window.location.href = `tel:${phone}`;
                else alert('Call masking active — your call will be connected through Aladdin.');
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-ink-sub hover:bg-surface-alt/50 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" /> Call
            </button>
            {address ? (
              <a href={mapsUrl} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-ink-sub hover:bg-surface-alt/50 transition-colors">
                <Navigation className="w-3.5 h-3.5" /> Navigate
              </a>
            ) : (
              <div className="flex items-center justify-center py-2.5 text-xs text-ink-dim">—</div>
            )}
          </div>
        </div>

        {/* ── Desktop: Customer card (original) ── */}
        <div className="hidden sm:block bg-white rounded-panel border border-border-dim p-5 shadow-card">
          <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-4">Customer</p>
          <div className="flex items-center gap-3 mb-4">
            <img
              src={customer?.user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer?.user?.name ?? 'User')}&size=160&background=cdd9d0&color=1c3828&bold=true&rounded=true`}
              alt={customer?.user?.name}
              className="w-12 h-12 rounded-card object-cover shrink-0"
            />
            <div className="flex-1">
              <p className="font-bold">{customer?.user?.name}</p>
              {address && (
                <p className="text-xs text-ink-dim flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" /> {address}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const phone = customer?.phone;
                if (phone) window.location.href = `tel:${phone}`;
                else alert('Call masking active — your call will be connected through Aladdin.');
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-border rounded-input text-sm font-bold hover:border-border transition-colors"
            >
              <Phone className="w-4 h-4" /> Call
            </button>
            <button onClick={() => setShowChat(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand text-white rounded-input text-sm font-bold hover:bg-brand-dark transition-colors">
              <MessageSquare className="w-4 h-4" /> Message
            </button>
            {address && (
              <a href={mapsUrl} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-input text-sm font-bold hover:border-border transition-colors">
                <Navigation className="w-4 h-4" /> Navigate
              </a>
            )}
          </div>
        </div>

        {/* ── Desktop: Job details (original) ── */}
        <div className="hidden sm:block bg-white rounded-panel border border-border-dim p-5 shadow-card">
          <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-4">Job Details</p>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-dim flex items-center gap-2"><Clock className="w-4 h-4" /> Scheduled</span>
              <span className="font-semibold">
                {new Date(booking.scheduledAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-dim">Your earnings</span>
              <span className="font-bold text-trust">€{earnings}</span>
            </div>
            {booking.quote?.estimatedHours && (
              <div className="flex justify-between">
                <span className="text-ink-dim">Estimated hours</span>
                <span className="font-semibold">~{booking.quote.estimatedHours}h</span>
              </div>
            )}
          </div>
          {booking.quote?.notes && (
            <div className="mt-4 p-3 bg-surface-alt rounded-input border border-border-dim">
              <p className="text-xs text-ink-dim font-bold uppercase tracking-widest mb-1">Job notes</p>
              <p className="text-sm text-ink-sub whitespace-pre-wrap">{booking.quote.notes}</p>
            </div>
          )}
        </div>

        {/* ── Mobile: Job notes (if present) ── */}
        {booking.quote?.notes && (
          <div className="sm:hidden bg-white rounded-2xl border border-border-dim p-3.5 shadow-sm">
            <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-1.5">Job Notes</p>
            <p className="text-sm text-ink-sub whitespace-pre-wrap leading-relaxed">{booking.quote.notes}</p>
          </div>
        )}

        {/* ── Checklist ── */}
        <div className="bg-white rounded-2xl sm:rounded-panel border border-border-dim p-3.5 sm:p-5 shadow-sm sm:shadow-card">
          <div className="flex items-center justify-between mb-2.5 sm:mb-4">
            <p className="text-xs sm:text-[10px] font-bold text-ink-dim uppercase tracking-widest">Checklist</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              completedTasks === DEFAULT_CHECKLIST.length
                ? 'bg-trust-surface text-trust'
                : 'bg-surface-alt text-ink-dim'
            }`}>
              {completedTasks}/{DEFAULT_CHECKLIST.length}
            </span>
          </div>
          <div className="w-full bg-surface-alt rounded-full h-1 sm:h-1.5 mb-3 sm:mb-4">
            <div className={`h-full rounded-full transition-all ${
              completedTasks === DEFAULT_CHECKLIST.length ? 'bg-trust' : 'bg-brand'
            }`} style={{ width: `${(completedTasks / DEFAULT_CHECKLIST.length) * 100}%` }} />
          </div>
          <div className="space-y-0.5 sm:space-y-2">
            {DEFAULT_CHECKLIST.map((task, i) => (
              <button
                key={i}
                onClick={() => setChecklist(prev => prev.map((v, j) => j === i ? !v : v))}
                className={`w-full flex items-center gap-2.5 sm:gap-3 px-2.5 sm:px-3 py-2.5 sm:py-3 rounded-xl sm:rounded-input text-left transition-all ${
                  checklist[i]
                    ? 'bg-trust-surface/50'
                    : 'hover:bg-surface-alt active:bg-surface-alt'
                }`}
              >
                {checklist[i]
                  ? <CheckCircle2 className="w-5 h-5 text-trust shrink-0" />
                  : <div className="w-5 h-5 rounded-full border-2 border-border shrink-0" />
                }
                <span className={`text-[13px] sm:text-sm leading-snug ${
                  checklist[i] ? 'line-through text-ink-dim' : 'font-medium text-ink'
                }`}>{task}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Photos / Documentation ── */}
        <div className="bg-white rounded-2xl sm:rounded-panel border border-border-dim p-3.5 sm:p-5 shadow-sm sm:shadow-card">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-ink-dim sm:hidden" />
              <p className="text-xs sm:text-[10px] font-bold text-ink-dim uppercase tracking-widest">Documentation</p>
            </div>
            <span className="text-[10px] font-medium text-ink-dim">{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
          {photos.length === 0 ? (
            /* Empty state */
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadingPhoto}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-border hover:border-brand hover:bg-brand-muted/30 transition-all group"
            >
              <div className="w-10 h-10 bg-surface-alt rounded-xl flex items-center justify-center shrink-0 group-hover:bg-brand-muted transition-colors">
                {uploadingPhoto
                  ? <Loader2 className="w-4 h-4 animate-spin text-ink-dim" />
                  : <ImagePlus className="w-4 h-4 text-ink-dim group-hover:text-brand transition-colors" />
                }
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-ink">Add photos</p>
                <p className="text-[11px] text-ink-dim">Before, during & after — document your work</p>
              </div>
            </button>
          ) : (
            /* Photo grid */
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {photos.map((p, i) => (
                <div key={i} className="relative w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-xl sm:rounded-input overflow-hidden border border-border">
                  <img src={p.preview} alt={p.label} className="w-full h-full object-cover" />
                  <button
                    onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingPhoto}
                className="w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-xl sm:rounded-input border-2 border-dashed border-border flex flex-col items-center justify-center gap-0.5 hover:border-brand transition-colors text-ink-dim hover:text-brand"
              >
                {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ImagePlus className="w-4 h-4" /><span className="text-[9px] font-bold">Add</span></>}
              </button>
            </div>
          )}
        </div>

        {/* ── Issue / Support ── */}
        {!isCanceled && (
          <Link href="/provider/disputes"
            className="flex items-center gap-3 p-3 sm:p-4 bg-white sm:bg-surface-alt rounded-xl sm:rounded-card border border-border-dim sm:border-border-dim text-sm group hover:border-caution-edge transition-all">
            <div className="w-8 h-8 bg-surface-alt sm:bg-white rounded-lg flex items-center justify-center shrink-0 group-hover:bg-caution-surface transition-colors">
              <AlertTriangle className="w-4 h-4 text-ink-dim group-hover:text-caution transition-colors" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-ink">Report an issue</p>
              <p className="text-[10px] text-ink-dim">Problems, disputes or safety concerns</p>
            </div>
            <ChevronRight className="w-4 h-4 text-ink-dim shrink-0" />
          </Link>
        )}
      </div>

      {/* Bottom action bar */}
      {!isCanceled && !isCompleted && flow.next && (
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <div className="bg-white/95 backdrop-blur-sm border-t border-border-dim p-3 sm:p-4">
            <div className="max-w-2xl mx-auto">
              <button
                onClick={() => updateStatus(flow.next)}
                disabled={actioning}
                className="w-full bg-brand text-white py-3.5 sm:py-4 rounded-2xl sm:rounded-card font-semibold text-sm hover:bg-brand-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-elevated"
              >
                {actioning ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> {flow.nextLabel}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
