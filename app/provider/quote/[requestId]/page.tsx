'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Plus, X, Send, Loader2, CheckCircle2, Check, AlertCircle,
} from 'lucide-react';
import { TIME_OF_DAY_LABELS } from '@/lib/time';
import { useTranslation } from '@/lib/i18n';
import {
  Button, buttonVariants, Card, Input, PageHeader, SectionHeader,
  StatusBadge, Textarea, useToast,
} from '@/components/ui';
import { cn } from '@/lib/utils';

const EXPIRY_OPTIONS = ['1', '2', '3', '7'] as const;

export default function QuoteBuilderPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const router = useRouter();
  const t = useTranslation();
  const { toast } = useToast();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [basePrice, setBasePrice] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [lineItems, setLineItems] = useState<{name: string; amount: string}[]>([]);
  const [materialsNote, setMaterialsNote] = useState('');
  const [exclusions, setExclusions] = useState('');
  const [notes, setNotes] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('3');

  useEffect(() => {
    fetch(`/api/requests?id=${requestId}`)
      .then(r => r.json())
      .then(d => { setRequest(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [requestId]);

  const totalPrice = () => {
    const base = parseFloat(basePrice) || 0;
    const extras = lineItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    return base + extras;
  };

  const handleSubmit = async () => {
    if (!basePrice || parseFloat(basePrice) <= 0) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          price: totalPrice(),
          expiresInDays,
          estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
          notes: [
            notes,
            materialsNote ? `Materials: ${materialsNote}` : '',
            exclusions ? `Exclusions: ${exclusions}` : '',
            lineItems.length ? `Line items: ${lineItems.map(i => `${i.name} (€${i.amount})`).join(', ')}` : '',
          ].filter(Boolean).join('\n\n') || null,
        }),
      });
      if (res.ok) {
        // The quote IS the first message of the negotiation, so land the pro in
        // the conversation where the customer will counter or accept — not on a
        // terminal "sent!" screen that dead-ends back at the leads list.
        // POST /api/quotes returns threadId; it can still be null if thread
        // creation failed server-side, in which case keep the old success page.
        const created = await res.json().catch(() => ({} as any));
        if (created?.threadId) {
          router.push(`/messages?thread=${created.threadId}`);
          return;
        }
        setSubmitted(true);
      } else {
        const d = await res.json().catch(() => ({} as any));
        toast.error(d.error ?? t.quoteBuilder.sendFailed);
      }
    } catch {
      toast.error(t.common.networkError);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="w-20 h-20 bg-trust-surface rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-trust" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink mb-3">
          {t.quoteBuilder.sentTitle}
        </h1>
        <p className="text-ink-dim mb-8 max-w-sm mx-auto leading-relaxed">
          {t.quoteBuilder.sentDescPrefix} <strong className="text-ink">€{totalPrice().toFixed(2)}</strong> {t.quoteBuilder.sentDescSuffix}
        </p>
        <Link href="/provider/leads" className={buttonVariants({ variant: 'primary', size: 'lg' })}>
          {t.quoteBuilder.backToLeads}
        </Link>
      </div>
    );
  }

  const total = totalPrice();
  const canSubmit = !!basePrice && parseFloat(basePrice) > 0;

  return (
    <div className="max-w-2xl mx-auto">

      {/* ── Back ── */}
      <Link
        href="/provider/leads"
        className="inline-flex items-center gap-2 -ml-1.5 mb-3 px-1.5 py-1 rounded-input text-xs font-medium text-ink-dim hover:text-ink hover:bg-surface-alt transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.quoteBuilder.backToLeads}
      </Link>

      <PageHeader
        title={t.quoteBuilder.title}
        description={request?.category?.name}
        size="sm"
        className="mb-5"
      />

      <div className="space-y-5">

        {/* ── The request (quiet context) ── */}
        {request && (
          <Card padding="lg">
            <SectionHeader
              title={t.quoteBuilder.requestSummary}
              action={
                request.isUrgent
                  ? <StatusBadge variant="warning" label={t.leadsPage.badgeUrgent} />
                  : undefined
              }
            />
            <p className="text-sm text-ink-sub leading-relaxed">{request.description}</p>

            {Array.isArray(request.photoUrls) && request.photoUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {request.photoUrls.map((u: string) => (
                  <a
                    key={u}
                    href={u}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-14 h-14 rounded-input overflow-hidden border border-border-dim hover:border-brand transition-colors"
                  >
                    <img src={u} alt={t.quoteBuilder.photoAlt} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-dim mt-3">
              <span className="min-w-0 truncate">{request.address}</span>
              <span aria-hidden="true">·</span>
              <span>{new Date(request.dateWindow).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
              <span aria-hidden="true">·</span>
              <span>{TIME_OF_DAY_LABELS[request.timeOfDay] ?? t.wizard.timeFlexible}</span>
              {request.budget && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-bold text-trust">{t.quoteInbox.budgetLabel} €{request.budget}</span>
                </>
              )}
            </div>
          </Card>
        )}

        {/* ── Pricing — the page's centre of gravity ── */}
        <Card radius="panel" padding="lg" className="shadow-elevated">
          <SectionHeader title={t.quoteBuilder.pricing} />

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label={`${t.quoteBuilder.basePrice} *`}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={basePrice}
              onChange={e => setBasePrice(e.target.value)}
              placeholder="0.00"
              leading={<span className="text-sm font-bold">€</span>}
              className="font-bold"
            />
            <Input
              label={t.jobDetail.estimatedHours}
              labelNote={t.common.optional}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.5"
              value={estimatedHours}
              onChange={e => setEstimatedHours(e.target.value)}
              placeholder={t.quoteBuilder.hoursPlaceholder}
            />
          </div>

          {/* Line items */}
          <div className="mt-5">
            <p className="text-xs font-bold uppercase tracking-widest text-ink-dim">
              {t.quoteBuilder.optionalLineItems}
            </p>

            {lineItems.length > 0 && (
              <div className="space-y-3 mt-3">
                {lineItems.map((item, i) => (
                  <div key={i} className="flex flex-wrap items-end gap-2">
                    <Input
                      wrapperClassName="w-full min-w-0 sm:w-auto sm:flex-1"
                      label={t.quoteBuilder.lineItemDescription}
                      type="text"
                      value={item.name}
                      onChange={e => setLineItems(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                      placeholder={t.quoteBuilder.itemPlaceholder}
                    />
                    <Input
                      wrapperClassName="flex-1 min-w-0 sm:flex-none sm:w-32"
                      label={t.quoteBuilder.lineItemAmount}
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={item.amount}
                      onChange={e => setLineItems(prev => prev.map((x, j) => j === i ? { ...x, amount: e.target.value } : x))}
                      placeholder="0"
                      leading={<span className="text-sm">€</span>}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      aria-label={t.quoteBuilder.removeLineItem}
                      onClick={() => setLineItems(p => p.filter((_, j) => j !== i))}
                      className="shrink-0 w-11 h-11 p-0 hover:text-danger"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setLineItems(p => [...p, { name: '', amount: '' }])}
              className="mt-3"
            >
              <Plus className="w-4 h-4" /> {t.quoteBuilder.addLineItem}
            </Button>
          </div>

          {/* Total — always mounted so the card never jumps on first keystroke */}
          <div className="mt-5 flex items-center justify-between gap-3 bg-brand-muted rounded-card px-4 py-3">
            <span className="text-xs font-bold uppercase tracking-widest text-brand">
              {t.quoteBuilder.totalQuote}
            </span>
            <span className="text-xl font-bold text-brand-dark tabular-nums">
              €{total.toFixed(2)}
            </span>
          </div>
        </Card>

        {/* ── Notes & terms (quiet) ── */}
        <Card padding="lg">
          <SectionHeader title={t.quoteBuilder.notesTerms} />
          <div className="space-y-4">
            <Textarea
              label={t.quoteBuilder.messageToCustomer}
              labelNote={t.common.optional}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder={t.quoteBuilder.messagePlaceholder}
            />
            <Input
              label={t.quoteBuilder.materialsNoteLabel}
              labelNote={t.common.optional}
              type="text"
              value={materialsNote}
              onChange={e => setMaterialsNote(e.target.value)}
              placeholder={t.quoteBuilder.materialsPlaceholder}
            />
            <Input
              label={t.quoteBuilder.exclusionsLabel}
              labelNote={t.common.optional}
              type="text"
              value={exclusions}
              onChange={e => setExclusions(e.target.value)}
              placeholder={t.quoteBuilder.exclusionsPlaceholder}
            />
          </div>
        </Card>

        {/* ── Expiry (quiet) ── */}
        <Card padding="lg">
          <SectionHeader title={t.quoteBuilder.quoteExpiry} />
          <div className="flex gap-2">
            {EXPIRY_OPTIONS.map(d => {
              const sel = expiresInDays === d;
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={sel}
                  onClick={() => setExpiresInDays(d)}
                  className={cn(
                    'flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-input border text-sm font-bold transition-colors',
                    sel
                      ? 'border-brand bg-brand-muted text-brand'
                      : 'border-border bg-card text-ink-sub hover:bg-surface-alt',
                  )}
                >
                  {sel && <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />}
                  {d}{t.quoteBuilder.daysShortBtn}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-ink-dim mt-2.5">
            {t.quoteBuilder.expiresPrefix} {new Date(Date.now() + parseInt(expiresInDays) * 86400000).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
        </Card>

        <div>
          <Button
            size="lg"
            className="w-full"
            loading={submitting}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            <Send className="w-4 h-4" /> {t.leadsPage.sendQuote} · €{total.toFixed(2)}
          </Button>
          {!canSubmit && (
            <p className="flex items-center justify-center gap-1.5 text-xs text-ink-dim mt-2.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {t.quoteBuilder.basePriceRequired}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
