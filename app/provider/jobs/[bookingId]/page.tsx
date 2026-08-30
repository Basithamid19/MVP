'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, Phone, MessageSquare, CheckCircle2, Check,
  Camera, Loader2, Navigation, Clock, X,
  ImagePlus, AlertTriangle, ChevronRight,
} from 'lucide-react';
import ChatPage from '@/components/shared/chat-view';
import {
  Alert, Avatar, Button, buttonVariants, Card,
  DomainStatusBadge, StatusBadge, useToast,
} from '@/components/ui';
import { formatVilnius } from '@/lib/time';
import { providerNet } from '@/lib/fees';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

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
  const { toast } = useToast();
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
        toast.error(d.error ?? t.jobDetail.updateFailed);
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
  // The action bar is `fixed` — the page needs its own clearance on top of the
  // shell's MobileNav padding, or the bar sits on the last card.
  const hasActionBar = !isCanceled && !isCompleted && !!flow.next;
  // Messaging only unlocks once the booking is confirmed (deposit paid).
  // Mirrors the server-side gate in lib/chat-access.ts.
  const chatUnlocked =
    ['DEPOSIT_HELD', 'PAID', 'PROCESSING'].includes(booking.payment?.status) ||
    ['IN_PROGRESS', 'COMPLETED'].includes(booking.status);
  const address = booking.quote?.request?.address;
  const mapsUrl = address ? `https://maps.google.com/?q=${encodeURIComponent(address)}` : '#';
  const completedTasks = checklist.filter(Boolean).length;
  const allDone = completedTasks === CHECKLIST_KEYS.length;
  const earnings = providerNet(booking.totalAmount).toFixed(2);

  return (
    <div className={`max-w-2xl mx-auto ${hasActionBar ? 'pb-24 md:pb-28' : ''}`}>

      {/* ── Back ── */}
      <Link
        href="/provider/jobs"
        className="inline-flex items-center gap-2 -ml-1.5 mb-3 px-1.5 py-1 rounded-input text-xs font-medium text-ink-dim hover:text-ink hover:bg-surface-alt transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.jobDetail.backToJobs}
      </Link>

      {/* ── Header — one tree, booking status leads, deposit state follows ── */}
      <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl font-bold text-ink tracking-tight truncate">
            {booking.quote?.request?.category?.name ?? t.providerDashboard.jobFallback}
          </h1>
          <p className="text-2xs sm:text-xs text-ink-dim mt-0.5">{t.jobDetail.idLabel} {booking.id.slice(0, 8)}…</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <DomainStatusBadge kind="booking" status={booking.status} dict={t} />
          {!isCanceled && !isCompleted && (
            <StatusBadge
              variant={chatUnlocked ? 'success' : 'warning'}
              label={chatUnlocked ? t.jobDetail.depositPaid : t.jobDetail.depositPending}
            />
          )}
        </div>
      </div>

      <div className="space-y-3 sm:space-y-5">

        {/* Stripe Connect setup — quiet notice, not a slab */}
        {!booking.provider?.stripeOnboarded && !isCanceled && (
          <Alert
            variant="caution"
            icon={AlertTriangle}
            title={t.jobDetail.stripeTitle}
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  const res = await fetch('/api/provider/stripe-connect', { method: 'POST' });
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                }}
              >
                {t.earningsPage.setUpPayouts}
              </Button>
            }
          >
            {t.earningsPage.payoutSetupDesc}
          </Alert>
        )}

        {/* ── Customer ── */}
        <Card padding="none" className="p-4 sm:p-5">
          <p className="text-3xs font-bold text-ink-dim uppercase tracking-widest mb-3 sm:mb-4">{t.jobDetail.customer}</p>
          <div className="flex items-center gap-3 mb-4">
            <Avatar
              src={customer?.user?.image}
              name={customer?.user?.name ?? ''}
              size="md"
              shape="square"
            />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-ink truncate">{customer?.user?.name}</p>
              {address && (
                <p className="text-xs text-ink-dim flex items-center gap-1 mt-0.5 min-w-0">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{address}</span>
                </p>
              )}
            </div>
          </div>
          {/* One responsive action row — absent affordances simply don't render */}
          <div className="flex flex-wrap gap-2">
            {chatUnlocked && (
              <Button className="flex-1 min-w-[8rem]" onClick={() => setShowChat(true)}>
                <MessageSquare className="w-4 h-4" /> {t.bookingDetail.message}
              </Button>
            )}
            <Button
              variant="secondary"
              className="flex-1 min-w-[8rem]"
              onClick={() => {
                const phone = customer?.phone;
                if (phone) window.location.href = `tel:${phone}`;
                else toast.info(t.bookingDetail.callMasking);
              }}
            >
              <Phone className="w-4 h-4" /> {t.bookingDetail.call}
            </Button>
            {address && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: 'secondary' }), 'flex-1 min-w-[8rem]')}
              >
                <Navigation className="w-4 h-4" /> {t.jobDetail.navigate}
              </a>
            )}
          </div>
        </Card>

        {/* ── Job details ── */}
        <Card padding="none" className="p-4 sm:p-5">
          <p className="text-3xs font-bold text-ink-dim uppercase tracking-widest mb-3 sm:mb-4">{t.jobDetail.jobDetails}</p>
          <div className="space-y-3 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-ink-dim flex items-center gap-2 shrink-0">
                <Clock className="w-4 h-4" /> {t.jobDetail.scheduled}
              </span>
              <span className="font-semibold text-ink text-right">
                {formatVilnius(booking.scheduledAt, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-ink-dim">{t.jobDetail.yourEarnings}</span>
              <span className="font-bold text-trust text-right">€{earnings}</span>
            </div>
            {booking.quote?.estimatedHours && (
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-ink-dim">{t.jobDetail.estimatedHours}</span>
                <span className="font-semibold text-ink text-right">~{booking.quote.estimatedHours}h</span>
              </div>
            )}
          </div>
          {booking.quote?.notes && (
            <div className="mt-4 p-3 bg-surface-alt rounded-input border border-border-dim">
              <p className="text-3xs text-ink-dim font-bold uppercase tracking-widest mb-1">{t.jobDetail.jobNotes}</p>
              <p className="text-sm text-ink-sub whitespace-pre-wrap leading-relaxed">{booking.quote.notes}</p>
            </div>
          )}
        </Card>

        {/* ── Checklist ── */}
        <Card padding="none" className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
            <p className="text-3xs font-bold text-ink-dim uppercase tracking-widest">{t.jobDetail.checklistTitle}</p>
            <StatusBadge
              variant={allDone ? 'success' : 'neutral'}
              label={`${completedTasks}/${CHECKLIST_KEYS.length}`}
            />
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface-alt mb-4 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${(completedTasks / CHECKLIST_KEYS.length) * 100}%` }}
            />
          </div>
          <div className="space-y-1">
            {CHECKLIST_KEYS.map((taskKey, i) => (
              <button
                key={i}
                type="button"
                aria-pressed={checklist[i]}
                onClick={() => setChecklist(prev => prev.map((v, j) => j === i ? !v : v))}
                className={cn(
                  'w-full flex items-center gap-3 px-2.5 py-2.5 rounded-input text-left transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
                  checklist[i] ? 'bg-brand-muted/40' : 'hover:bg-surface-alt active:bg-surface-alt',
                )}
              >
                <span
                  className={cn(
                    'w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors',
                    checklist[i] ? 'bg-brand border-brand text-white' : 'border-border',
                  )}
                >
                  {checklist[i] && <Check className="w-3 h-3" strokeWidth={3} />}
                </span>
                <span className={cn(
                  'text-sm leading-snug',
                  checklist[i] ? 'line-through text-ink-dim' : 'font-medium text-ink',
                )}>
                  {t.jobDetail[taskKey]}
                </span>
              </button>
            ))}
          </div>
        </Card>

        {/* ── Photos / Documentation ── */}
        <Card padding="none" className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-ink-dim" />
              <p className="text-3xs font-bold text-ink-dim uppercase tracking-widest">{t.jobDetail.documentation}</p>
            </div>
            <span className="text-2xs font-medium text-ink-dim">
              {photos.length} {photos.length !== 1 ? t.jobDetail.photosPlural : t.jobDetail.photoSingular}
            </span>
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
              className="w-full flex items-center gap-3 p-3 rounded-input border border-dashed border-border hover:border-brand hover:bg-brand-muted/30 transition-all group"
            >
              <div className="w-10 h-10 bg-surface-alt rounded-input flex items-center justify-center shrink-0 group-hover:bg-brand-muted transition-colors">
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
                <div key={i} className="relative w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-input overflow-hidden border border-border">
                  <img src={p.preview} alt={p.label} className="w-full h-full object-cover" />
                  <button
                    onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-5 h-5 bg-ink/60 rounded-full flex items-center justify-center backdrop-blur-sm"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingPhoto}
                className="w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-input border-2 border-dashed border-border flex flex-col items-center justify-center gap-0.5 hover:border-brand transition-colors text-ink-dim hover:text-brand"
              >
                {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ImagePlus className="w-4 h-4" /><span className="text-3xs font-bold">{t.jobDetail.add}</span></>}
              </button>
            </div>
          )}
          {/* Photos and the checklist are localStorage-only — say so plainly
              instead of whispering "this device only" inside a count line. */}
          <Alert variant="info" className="mt-3">
            {t.jobDetail.deviceOnlyNotice}
          </Alert>
        </Card>

        {/* ── Issue / Support ── */}
        {!isCanceled && (
          <Link href="/provider/disputes"
            className="flex items-center gap-3 p-3 sm:p-4 bg-card rounded-card border border-border-dim group hover:border-caution-edge transition-colors">
            <div className="w-8 h-8 bg-surface-alt rounded-input flex items-center justify-center shrink-0 group-hover:bg-caution-surface transition-colors">
              <AlertTriangle className="w-4 h-4 text-ink-dim group-hover:text-caution transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink">{t.bookingDetail.reportIssue}</p>
              <p className="text-2xs text-ink-dim">{t.jobDetail.reportIssueDesc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-ink-dim shrink-0" />
          </Link>
        )}
      </div>

      {/* Bottom action bar — status can only advance once the deposit is paid
          (server enforces the same rule with a 409). Until then the advance
          button stays visibly disabled with the reason spelled out above it. */}
      {hasActionBar && (
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <div className="bg-card/95 backdrop-blur-sm border-t border-border-dim p-3 sm:p-4">
            <div className="max-w-2xl mx-auto">
              {!chatUnlocked && (
                <p className="text-xs text-ink-dim text-center mb-2">{t.jobDetail.awaitingDeposit}</p>
              )}
              <Button
                onClick={() => updateStatus(flow.next)}
                loading={actioning}
                disabled={!chatUnlocked}
                size="lg"
                className="w-full py-3.5 sm:py-4 shadow-elevated"
              >
                {chatUnlocked
                  ? (!actioning && <CheckCircle2 className="w-5 h-5" />)
                  : <Clock className="w-5 h-5" />}
                {nextLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
