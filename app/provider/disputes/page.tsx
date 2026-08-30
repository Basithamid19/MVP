'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  LifeBuoy, Upload, X, CheckCircle2, Check, Loader2,
  Star, DollarSign, MessageSquare, AlertTriangle, FileText, ArrowLeft,
} from 'lucide-react';
import { useTranslation, type Dictionary } from '@/lib/i18n';
import {
  Button, buttonVariants, Card, Input, PageHeader, SectionHeader,
  Textarea, useToast,
} from '@/components/ui';
import { cn } from '@/lib/utils';

type TicketType = 'dispute_review' | 'refund_request' | 'general' | 'no_show' | 'payment';

// `label` stays English on purpose: it is the value prefixed onto the ticket
// subject in the POST payload (`[Dispute a review] …`), which admins triage
// on. Only the rendered copy is localized — see typeCopy() below.
const TICKET_TYPES: { id: TicketType; label: string; icon: React.ElementType }[] = [
  { id: 'dispute_review', label: 'Dispute a review',      icon: Star },
  { id: 'refund_request', label: 'Request refund review', icon: DollarSign },
  { id: 'no_show',        label: 'Customer no-show',      icon: AlertTriangle },
  { id: 'payment',        label: 'Payment issue',         icon: DollarSign },
  { id: 'general',        label: 'General support',       icon: MessageSquare },
];

function typeCopy(id: TicketType, t: Dictionary): { label: string; desc: string } {
  const c = t.disputesPage.types;
  switch (id) {
    case 'dispute_review': return { label: c.disputeReviewLabel, desc: c.disputeReviewDesc };
    case 'refund_request': return { label: c.refundRequestLabel, desc: c.refundRequestDesc };
    case 'no_show':        return { label: c.noShowLabel,        desc: c.noShowDesc };
    case 'payment':        return { label: c.paymentLabel,       desc: c.paymentDesc };
    default:               return { label: c.generalLabel,       desc: c.generalDesc };
  }
}

type EvidenceItem = {
  uid: number;
  file: File;
  preview: string;
  name: string;
  status: 'uploading' | 'done' | 'error';
  url?: string;
};

export default function DisputesPage() {
  const t = useTranslation();
  const { toast } = useToast();
  const [ticketType, setTicketType] = useState<TicketType | null>(null);
  const [subject, setSubject] = useState('');
  const [subjectTouched, setSubjectTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const uidRef = useRef(0);

  const handleEvidenceSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingEvidence(true);
    for (const file of files) {
      const uid = ++uidRef.current;
      const preview = URL.createObjectURL(file);
      setEvidence(prev => [...prev, { uid, file, preview, name: file.name, status: 'uploading' }]);
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/uploads', { method: 'POST', body: fd });
        const data = await res.json().catch(() => ({} as any));
        if (!res.ok || !data?.url) throw new Error(data?.error ?? 'upload failed');
        // Keep the returned URL on the item — previously the response was
        // discarded, so a failed upload still rendered a confident thumbnail.
        setEvidence(prev => prev.map(x => x.uid === uid ? { ...x, status: 'done', url: data.url } : x));
      } catch {
        URL.revokeObjectURL(preview);
        setEvidence(prev => prev.filter(x => x.uid !== uid));
        toast.error(`${file.name} — ${t.disputesPage.uploadFailed}`);
      }
    }
    setUploadingEvidence(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeEvidence = (uid: number) => {
    setEvidence(prev => {
      const hit = prev.find(x => x.uid === uid);
      if (hit) URL.revokeObjectURL(hit.preview);
      return prev.filter(x => x.uid !== uid);
    });
  };

  const handleSubmit = async () => {
    if (!ticketType || !subject.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      const typeLabel = TICKET_TYPES.find(x => x.id === ticketType)?.label ?? 'Support';
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `[${typeLabel}] ${subject.trim()}`,
          description: `${description.trim()}${bookingRef.trim() ? `\n\nBooking ref: ${bookingRef.trim()}` : ''}`,
        }),
      });
      if (res.ok) {
        const d = await res.json().catch(() => ({} as any));
        setTicketId(d.id ?? null);
        setSubmitted(true);
      } else {
        const d = await res.json().catch(() => ({} as any));
        toast.error(d.error ?? t.disputesPage.submitFailed);
      }
    } catch {
      toast.error(t.common.networkError);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="w-20 h-20 bg-trust-surface rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-trust" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink mb-3">
          {t.disputesPage.successTitle}
        </h1>
        {ticketId && (
          <p className="text-ink-dim mb-2">
            {t.disputesPage.successTicketId}{' '}
            <span className="font-bold text-ink">AL-{ticketId.slice(0, 8).toUpperCase()}</span>
          </p>
        )}
        <p className="text-ink-dim mb-8 max-w-sm mx-auto leading-relaxed">
          {t.disputesPage.successDescPrefix}{' '}
          <strong className="text-ink">{t.disputesPage.successDescHours}</strong>{' '}
          {t.disputesPage.successDescSuffix}
        </p>
        <Link href="/provider/dashboard" className={buttonVariants({ variant: 'primary', size: 'lg' })}>
          {t.common.backToDashboard}
        </Link>
      </div>
    );
  }

  const descriptionPlaceholder =
    ticketType === 'dispute_review' ? t.disputesPage.descPlaceholderDisputeReview :
    ticketType === 'refund_request' ? t.disputesPage.descPlaceholderRefund :
    ticketType === 'no_show'        ? t.disputesPage.descPlaceholderNoShow :
    t.disputesPage.descPlaceholderDefault;

  return (
    <div className="max-w-2xl mx-auto">

      {/* ── Back ── */}
      <Link
        href="/provider/settings"
        className="inline-flex items-center gap-2 -ml-1.5 mb-3 px-1.5 py-1 rounded-input text-xs font-medium text-ink-dim hover:text-ink hover:bg-surface-alt transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.providerSettingsHub.backToSettings}
      </Link>

      <PageHeader
        title={t.disputesPage.title}
        description={t.disputesPage.description}
        size="sm"
        className="mb-5"
      />

      <div className="space-y-5">

        {/* ── Ticket type ── */}
        <Card padding="lg">
          <SectionHeader title={t.disputesPage.typeQuestion} />
          <div className="space-y-2">
            {TICKET_TYPES.map(type => {
              const sel = ticketType === type.id;
              const copy = typeCopy(type.id, t);
              return (
                <button
                  key={type.id}
                  type="button"
                  aria-pressed={sel}
                  onClick={() => {
                    setTicketType(type.id);
                    // Only prefill while the provider has not written their own
                    // subject — the old handler silently clobbered typed text
                    // on every type change.
                    if (!subjectTouched) setSubject(type.label);
                  }}
                  className={cn(
                    'w-full flex items-start gap-3 p-4 rounded-card border text-left transition-colors',
                    sel
                      ? 'border-brand bg-brand-muted'
                      : 'border-border bg-card hover:bg-surface-alt',
                  )}
                >
                  <type.icon
                    className={cn('w-5 h-5 shrink-0 mt-0.5', sel ? 'text-brand' : 'text-ink-dim')}
                  />
                  <span className="min-w-0 flex-1">
                    <span className={cn('block font-bold text-sm', sel ? 'text-brand' : 'text-ink')}>
                      {copy.label}
                    </span>
                    <span className="block text-xs text-ink-dim mt-0.5 leading-relaxed">
                      {copy.desc}
                    </span>
                  </span>
                  {sel && <Check className="w-4 h-4 shrink-0 mt-0.5 text-brand" strokeWidth={2.5} />}
                </button>
              );
            })}
          </div>
        </Card>

        {ticketType && (
          <>
            {/* ── Details ── */}
            <Card padding="lg">
              <SectionHeader title={t.disputesPage.sectionDetails} />
              <div className="space-y-4">
                <Input
                  label={`${t.disputesPage.subjectLabel} *`}
                  type="text"
                  value={subject}
                  onChange={e => { setSubjectTouched(true); setSubject(e.target.value); }}
                  placeholder={t.disputesPage.subjectPlaceholder}
                />

                <Input
                  label={t.disputesPage.bookingRefLabel}
                  labelNote={t.common.optional}
                  type="text"
                  value={bookingRef}
                  onChange={e => setBookingRef(e.target.value)}
                  placeholder={t.disputesPage.bookingRefPlaceholder}
                />

                <Textarea
                  label={`${t.disputesPage.descriptionLabel} *`}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={5}
                  placeholder={descriptionPlaceholder}
                  hint={`${description.trim().length} ${t.disputesPage.charactersSuffix}`}
                />
              </div>
            </Card>

            {/* ── Evidence ── */}
            <Card padding="lg">
              <SectionHeader title={t.disputesPage.evidenceTitle} />
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                multiple
                className="hidden"
                onChange={handleEvidenceSelect}
              />
              <div className="flex flex-wrap gap-3">
                {evidence.map(f => (
                  <div key={f.uid} className="relative">
                    {f.file.type.startsWith('image/') ? (
                      <div className="w-20 h-20 rounded-input overflow-hidden border border-border relative">
                        <img src={f.preview} alt={f.name} className="w-full h-full object-cover" />
                        {f.status === 'uploading' && (
                          <div className="absolute inset-0 bg-ink/40 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                          </div>
                        )}
                        <button
                          type="button"
                          aria-label={`${t.disputesPage.evidenceRemove}: ${f.name}`}
                          onClick={() => removeEvidence(f.uid)}
                          className="absolute top-1 right-1 w-5 h-5 bg-ink/60 rounded-full flex items-center justify-center hover:bg-ink transition-colors"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 bg-surface-alt rounded-input border border-border">
                        {f.status === 'uploading'
                          ? <Loader2 className="w-4 h-4 text-ink-dim shrink-0 animate-spin" />
                          : <FileText className="w-4 h-4 text-ink-dim shrink-0" />}
                        <span className="text-xs font-medium text-ink-sub max-w-[80px] truncate">{f.name}</span>
                        <button
                          type="button"
                          aria-label={`${t.disputesPage.evidenceRemove}: ${f.name}`}
                          onClick={() => removeEvidence(f.uid)}
                          className="text-ink-dim hover:text-danger transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingEvidence}
                  className="w-20 h-20 rounded-input border border-dashed border-border flex flex-col items-center justify-center gap-1 text-ink-dim hover:border-brand hover:text-brand disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploadingEvidence
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><Upload className="w-4 h-4" /><span className="text-3xs font-bold">{t.disputesPage.evidenceUpload}</span></>}
                </button>
              </div>
              <p className="text-xs text-ink-dim mt-3 leading-relaxed">{t.disputesPage.evidenceHint}</p>
            </Card>

            <Button
              size="lg"
              className="w-full"
              loading={submitting}
              disabled={!subject.trim() || !description.trim()}
              onClick={handleSubmit}
            >
              <LifeBuoy className="w-4 h-4" /> {t.disputesPage.submit}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
