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
import { formatVilnius } from '@/lib/time';
import { providerNet } from '@/lib/fees';
import { localizedStatus } from '@/lib/status-labels';
import { useTranslation } from '@/lib/i18n';

// Transition map only — labels/colors come from the shared status module so
// every surface reads the same vocabulary. Button labels are resolved from the
// dictionary in the component (they need the active locale).
const STATUS_FLOW: Record<string, { next: string }> = {
  SCHEDULED:   { next: 'IN_PROGRESS' },
  IN_PROGRESS: { next: 'COMPLETED' },
  COMPLETED:   { next: '' },
  CANCELED:    { next: '' },
};

// Dictionary keys only — stable length for the localStorage-persisted state;
// labels are looked up through `t.jobDetail` at render time.
const CHECKLIST_KEYS = [
  'checkConfirmAddress',
  'checkInspectScope',
  'checkBeforePhotos',
  'checkCompleteJob',
  'checkCleanUp',
  'checkAfterPhotos',
  'checkConfirmCompletion',
] as const;

export default function ProviderJobDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();
  const t = useTranslation();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [checklist, setChecklist] = useState<boolean[]>(CHECKLIST_KEYS.map(() => false));
  const [photos, setPhotos] = useState<{ preview: string; label: string }[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Checklist + photos live on this device (localStorage per booking) — they
  // used to be plain useState and were wiped by any reload/navigation while
  // the UI implied saved records. hydratedRef stops the persist effects from
  // overwriting stored values with defaults before hydration lands.
  const hydratedRef = useRef(false);
  useEffect(() => {
    try {
      const savedChecklist = JSON.parse(localStorage.getItem(`aladdin_job_checklist_${bookingId}`) ?? 'null');
      if (Array.isArray(savedChecklist) && savedChecklist.length === CHECKLIST_KEYS.length) {
        setChecklist(savedChecklist.map(Boolean));
      }
      const savedPhotos = JSON.parse(localStorage.getItem(`aladdin_job_photos_${bookingId}`) ?? 'null');
      if (Array.isArray(savedPhotos)) {
        setPhotos(savedPhotos.filter((p: any) => typeof p?.preview === 'string'));
      }
    } catch {}
    hydratedRef.current = true;
  }, [bookingId]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    try { localStorage.setItem(`aladdin_job_checklist_${bookingId}`, JSON.stringify(checklist)); } catch {}
  }, [checklist, bookingId]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    try { localStorage.setItem(`aladdin_job_photos_${bookingId}`, JSON.stringify(photos)); } catch {}
  }, [photos, bookingId]);

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
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({} as any));
        alert(d.error ?? t.jobDetail.updateFailed);
      }
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
  if (!booking) return <div className="p-8 text-center"><p className="text-ink-dim">{t.jobDetail.notFound}</p></div>;

  if (showChat) {
    if (!booking.chatThread?.id) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <p className="text-ink-sub text-sm mb-4">{t.bookingDetail.noChat}</p>
          <button onClick={() => setShowChat(false)} className="text-brand font-semibold text-sm">{t.bookingDetail.goBack}</button>
        </div>
      );
    }
    return <ChatPage threadId={booking.chatThread.id} booking={booking} />;
  }

  const customer = booking.customer;
  const flow = STATUS_FLOW[booking.status] ?? STATUS_FLOW.SCHEDULED;
  const nextLabel =
    flow.next === 'IN_PROGRESS' ? t.jobDetail.startJob :
    flow.next === 'COMPLETED' ? t.bookingDetail.markComplete : '';
  const isCanceled = booking.status === 'CANCELED';
  const isCompleted = booking.status === 'COMPLETED';
  // Messaging only unlocks once the booking is confirmed (deposit paid).
  // Mirrors the server-side gate in lib/chat-access.ts.
  const chatUnlocked =
    ['DEPOSIT_HELD', 'PAID', 'PROCESSING'].includes(booking.payment?.status) ||
    ['IN_PROGRESS', 'COMPLETED'].includes(booking.status);
  const address = booking.quote?.request?.address;
  const mapsUrl = address ? `https://maps.google.com/?q=${encodeURIComponent(address)}` : '#';
  const completedTasks = checklist.filter(Boolean).length;
  const earnings = providerNet(booking.totalAmount).toFixed(2);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto pb-28">

      {/* ── Mobile: Unified header ── */}
      <div className="sm:hidden">
        {/* Back row */}
        <div className="flex items-center gap-2 mb-3">
          <Link href="/provider/jobs" className="p-1.5 -ml-1.5 hover:bg-surface-alt rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-ink-sub" />
          </Link>
          <span className="text-xs text-ink-dim">{t.jobDetail.backToJobs}</span>
        </div>

        {/* Title + status + earnings hero */}
        <div className="bg-white rounded-2xl border border-border-dim shadow-sm p-4 mb-3">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-ink tracking-tight">{booking.quote?.request?.category?.name ?? t.providerDashboard.jobFallback}</h1>
              <p className="text-3xs text-ink-dim mt-0.5 font-medium">{t.jobDetail.idLabel} {booking.id.slice(0, 8)}…</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className={`px-2.5 py-1 rounded-full text-3xs font-bold uppercase tracking-wide ${localizedStatus(t, 'booking', booking.status).cls}`}>
                {localizedStatus(t, 'booking', booking.status).label}
              </span>
              {!isCanceled && !isCompleted && (
                <span className={`px-2.5 py-1 rounded-full text-3xs font-bold uppercase tracking-wide ${
                  chatUnlocked ? 'bg-trust-surface text-trust' : 'bg-caution-surface text-caution'
                }`}>
                  {chatUnlocked ? t.jobDetail.depositPaid : t.jobDetail.depositPending}
                </span>
              )}
            </div>
          </div>

          {/* Key details strip */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border-dim">
            <div>
              <p className="text-3xs font-bold text-ink-dim uppercase tracking-widest mb-0.5">{t.jobDetail.earnings}</p>
              <p className="text-base font-bold text-trust">€{earnings}</p>
            </div>
            <div>
              <p className="text-3xs font-bold text-ink-dim uppercase tracking-widest mb-0.5">{t.jobDetail.scheduled}</p>
              <p className="text-xs font-semibold text-ink">
                {formatVilnius(booking.scheduledAt, { day: 'numeric', month: 'short' })}
              </p>
              <p className="text-3xs text-ink-dim">
                {formatVilnius(booking.scheduledAt, { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {booking.quote?.estimatedHours && (
              <div>
                <p className="text-3xs font-bold text-ink-dim uppercase tracking-widest mb-0.5">{t.jobDetail.duration}</p>
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
          <h1 className="font-bold">{booking.quote?.request?.category?.name ?? t.providerDashboard.jobFallback}</h1>
          <p className="text-xs text-ink-dim">{t.jobDetail.idLabel} {booking.id.slice(0, 8)}…</p>
        </div>
        {!isCanceled && !isCompleted && (
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
            chatUnlocked ? 'bg-trust-surface text-trust' : 'bg-caution-surface text-caution'
          }`}>
            {chatUnlocked ? t.jobDetail.depositPaid : t.jobDetail.depositPending}
          </span>
        )}
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${localizedStatus(t, 'booking', booking.status).cls}`}>
          {localizedStatus(t, 'booking', booking.status).label}
        </span>
      </div>

      <div className="space-y-3 sm:space-y-5">

        {/* Stripe Connect setup banner */}
        {!booking.provider?.stripeOnboarded && !isCanceled && (
          <div className="bg-caution-surface border border-caution-edge rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-caution shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-caution text-sm">{t.jobDetail.stripeTitle}</p>
              <p className="text-xs text-caution mt-0.5 mb-3 leading-relaxed">
                {t.earningsPage.payoutSetupDesc}
              </p>
              <button
                onClick={async () => {
                  const res = await fetch('/api/provider/stripe-connect', { method: 'POST' });
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                }}
                className="text-xs font-bold bg-caution text-white px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
              >
                {t.earningsPage.setUpPayouts}
              </button>
            </div>
          </div>
        )}

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
                <p className="text-2xs text-ink-dim flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-3 h-3 shrink-0" /> {address}
                </p>
              )}
            </div>
          </div>
          {/* Action row — Message only appears once the deposit is paid */}
          <div className={`border-t border-border-dim grid divide-x divide-border-dim ${chatUnlocked ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {chatUnlocked && (
              <button onClick={() => setShowChat(true)}
                className="flex items-center justify-center gap-1.5 py-2.5 bg-brand text-white text-xs font-semibold">
                <MessageSquare className="w-3.5 h-3.5" /> {t.bookingDetail.message}
              </button>
            )}
            <button
              onClick={() => {
                const phone = customer?.phone;
                if (phone) window.location.href = `tel:${phone}`;
                else alert(t.bookingDetail.callMasking);
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-ink-sub hover:bg-surface-alt/50 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" /> {t.bookingDetail.call}
            </button>
            {address ? (
              <a href={mapsUrl} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-ink-sub hover:bg-surface-alt/50 transition-colors">
                <Navigation className="w-3.5 h-3.5" /> {t.jobDetail.navigate}
              </a>
            ) : (
              <div className="flex items-center justify-center py-2.5 text-xs text-ink-dim">—</div>
            )}
          </div>
        </div>

        {/* ── Desktop: Customer card (original) ── */}
        <div className="hidden sm:block bg-white rounded-panel border border-border-dim p-5 shadow-card">
          <p className="text-3xs font-bold text-ink-dim uppercase tracking-widest mb-4">{t.jobDetail.customer}</p>
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
                else alert(t.bookingDetail.callMasking);
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-border rounded-input text-sm font-bold hover:border-border transition-colors"
            >
              <Phone className="w-4 h-4" /> {t.bookingDetail.call}
            </button>
            {chatUnlocked && (
              <button onClick={() => setShowChat(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand text-white rounded-input text-sm font-bold hover:bg-brand-dark transition-colors">
                <MessageSquare className="w-4 h-4" /> {t.bookingDetail.message}
              </button>
            )}
            {address && (
              <a href={mapsUrl} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-input text-sm font-bold hover:border-border transition-colors">
                <Navigation className="w-4 h-4" /> {t.jobDetail.navigate}
              </a>
            )}
          </div>
        </div>

        {/* ── Desktop: Job details (original) ── */}
        <div className="hidden sm:block bg-white rounded-panel border border-border-dim p-5 shadow-card">
          <p className="text-3xs font-bold text-ink-dim uppercase tracking-widest mb-4">{t.jobDetail.jobDetails}</p>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-dim flex items-center gap-2"><Clock className="w-4 h-4" /> {t.jobDetail.scheduled}</span>
              <span className="font-semibold">
                {formatVilnius(booking.scheduledAt, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-dim">{t.jobDetail.yourEarnings}</span>
              <span className="font-bold text-trust">€{earnings}</span>
            </div>
            {booking.quote?.estimatedHours && (
              <div className="flex justify-between">
                <span className="text-ink-dim">{t.jobDetail.estimatedHours}</span>
                <span className="font-semibold">~{booking.quote.estimatedHours}h</span>
              </div>
            )}
          </div>
          {booking.quote?.notes && (
            <div className="mt-4 p-3 bg-surface-alt rounded-input border border-border-dim">
              <p className="text-xs text-ink-dim font-bold uppercase tracking-widest mb-1">{t.jobDetail.jobNotes}</p>
              <p className="text-sm text-ink-sub whitespace-pre-wrap">{booking.quote.notes}</p>
            </div>
          )}
        </div>

        {/* ── Mobile: Job notes (if present) ── */}
        {booking.quote?.notes && (
          <div className="sm:hidden bg-white rounded-2xl border border-border-dim p-3.5 shadow-sm">
            <p className="text-3xs font-bold text-ink-dim uppercase tracking-widest mb-1.5">{t.jobDetail.jobNotes}</p>
            <p className="text-sm text-ink-sub whitespace-pre-wrap leading-relaxed">{booking.quote.notes}</p>
          </div>
        )}

        {/* ── Checklist ── */}
        <div className="bg-white rounded-2xl sm:rounded-panel border border-border-dim p-3.5 sm:p-5 shadow-sm sm:shadow-card">
          <div className="flex items-center justify-between mb-2.5 sm:mb-4">
            <p className="text-xs sm:text-3xs font-bold text-ink-dim uppercase tracking-widest">{t.jobDetail.checklistTitle}</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              completedTasks === CHECKLIST_KEYS.length
                ? 'bg-trust-surface text-trust'
                : 'bg-surface-alt text-ink-dim'
            }`}>
              {completedTasks}/{CHECKLIST_KEYS.length}
            </span>
          </div>
          <div className="w-full bg-surface-alt rounded-full h-1 sm:h-1.5 mb-3 sm:mb-4">
            <div className={`h-full rounded-full transition-all ${
              completedTasks === CHECKLIST_KEYS.length ? 'bg-trust' : 'bg-brand'
            }`} style={{ width: `${(completedTasks / CHECKLIST_KEYS.length) * 100}%` }} />
          </div>
          <div className="space-y-0.5 sm:space-y-2">
            {CHECKLIST_KEYS.map((taskKey, i) => (
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
                <span className={`text-sm sm:text-sm leading-snug ${
                  checklist[i] ? 'line-through text-ink-dim' : 'font-medium text-ink'
                }`}>{t.jobDetail[taskKey]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Photos / Documentation ── */}
        <div className="bg-white rounded-2xl sm:rounded-panel border border-border-dim p-3.5 sm:p-5 shadow-sm sm:shadow-card">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-ink-dim sm:hidden" />
              <p className="text-xs sm:text-3xs font-bold text-ink-dim uppercase tracking-widest">{t.jobDetail.documentation}</p>
            </div>
            <span className="text-3xs font-medium text-ink-dim">{photos.length} {photos.length !== 1 ? t.jobDetail.photosPlural : t.jobDetail.photoSingular} · {t.jobDetail.thisDeviceOnly}</span>
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
                <p className="text-sm font-semibold text-ink">{t.jobDetail.addPhotos}</p>
                <p className="text-2xs text-ink-dim">{t.jobDetail.addPhotosDesc}</p>
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
                {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ImagePlus className="w-4 h-4" /><span className="text-3xs font-bold">{t.jobDetail.add}</span></>}
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
              <p className="text-xs font-semibold text-ink">{t.bookingDetail.reportIssue}</p>
              <p className="text-3xs text-ink-dim">{t.jobDetail.reportIssueDesc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-ink-dim shrink-0" />
          </Link>
        )}
      </div>

      {/* Bottom action bar — status can only advance once the deposit is paid
          (server enforces the same rule with a 409). Until then, show an
          explicit "awaiting deposit" state so the provider knows not to start. */}
      {!isCanceled && !isCompleted && flow.next && (
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <div className="bg-white/95 backdrop-blur-sm border-t border-border-dim p-3 sm:p-4">
            <div className="max-w-2xl mx-auto">
              {chatUnlocked ? (
                <button
                  onClick={() => updateStatus(flow.next)}
                  disabled={actioning}
                  className="w-full bg-brand text-white py-3.5 sm:py-4 rounded-2xl sm:rounded-card font-semibold text-sm hover:bg-brand-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-elevated"
                >
                  {actioning ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> {nextLabel}</>}
                </button>
              ) : (
                <div className="w-full flex items-center justify-center gap-2 py-3.5 sm:py-4 bg-caution-surface border border-caution-edge rounded-2xl sm:rounded-card">
                  <Clock className="w-4 h-4 text-caution shrink-0" />
                  <p className="text-sm font-semibold text-caution">
                    {t.jobDetail.awaitingDeposit}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
