'use client';

import React, { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Hourglass } from 'lucide-react';
import {
  Alert, Button, Input, Modal, ModalFooter, StatusBadge, Textarea, useToast,
} from '@/components/ui';
import type { BadgeVariant } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useLocale, useTranslation } from '@/lib/i18n';
import type { Dictionary, Locale } from '@/lib/i18n/types';

/* ─── OfferCard ──────────────────────────────────────────────────────────────
 * The negotiation happens INSIDE the conversation: every offer / counter /
 * accept / decline is a persisted ChatMessage with kind='offer', and this card
 * is how one of those renders in the stream. Deliberately NOT a bubble — it is
 * a full-width card so a price on the table never reads as chatter.
 *
 * Contract (see the doc comment at the top of app/api/chat/route.ts):
 *   message.payload = { action, quoteId, price, estimatedHours, expiresAt,
 *                       note, by }
 *   GET /api/chat?threadId → { messages, textUnlocked, negotiation }
 *
 * The action row appears on exactly ONE card in a thread — the latest offer
 * message, when the thread's live negotiation still points at that quote, is
 * PENDING, and the ball is in the viewer's court. Everything else is history.
 * All three actions go through PATCH /api/quotes; nothing here writes chat
 * messages itself (the server does that).
 * ────────────────────────────────────────────────────────────────────────── */

export type Side = 'customer' | 'provider';

/** Live negotiation state for a thread — as returned by /api/chat. */
export interface Negotiation {
  quoteId: string;
  requestId?: string;
  price: number;
  currentPrice: number | null;
  effectivePrice: number;
  turn: Side;
  status: string;
  expiresAt: string | null;
  providerUserId: string | null;
}

/** ChatMessage.payload for kind='offer'. */
export interface OfferPayload {
  action: 'offer' | 'counter' | 'accept' | 'decline';
  quoteId: string;
  price: number;
  estimatedHours?: number | null;
  expiresAt?: string | null;
  note?: string | null;
  by: Side;
}

/** ChatMessage.payload for kind='system'. */
export interface SystemPayload {
  event: 'booking_created' | 'deposit_paid' | 'quote_auto_declined';
  bookingId?: string | null;
}

/**
 * Which side of the negotiation the viewer is on. Derived from the thread's
 * negotiation rather than the session role so an admin looking at a thread
 * gets `null` (read-only) instead of being mistaken for a participant.
 */
export function viewerSideOf(
  currentUserId: string | undefined,
  negotiation: Negotiation | null | undefined,
): Side | null {
  if (!currentUserId || !negotiation) return null;
  if (!negotiation.providerUserId) return null;
  return currentUserId === negotiation.providerUserId ? 'provider' : 'customer';
}

/** Narrow an unknown payload to an OfferPayload, or null if it isn't one. */
export function asOfferPayload(payload: unknown): OfferPayload | null {
  const p = payload as OfferPayload | null;
  if (!p || typeof p !== 'object') return null;
  if (p.action !== 'offer' && p.action !== 'counter' && p.action !== 'accept' && p.action !== 'decline') return null;
  if (typeof p.price !== 'number' || !Number.isFinite(p.price)) return null;
  if (typeof p.quoteId !== 'string' || !p.quoteId) return null;
  return p;
}

/** Narrow an unknown payload to a SystemPayload, or null if it isn't one. */
export function asSystemPayload(payload: unknown): SystemPayload | null {
  const p = payload as SystemPayload | null;
  if (!p || typeof p !== 'object') return null;
  if (p.event !== 'booking_created' && p.event !== 'deposit_paid' && p.event !== 'quote_auto_declined') return null;
  return p;
}

/* 409s from PATCH /api/quotes on accept carry an errorCode; the copy for each
   already exists on the quote inbox, so reuse it rather than forking wording. */
const AVAILABILITY_ERROR_KEYS: Record<string, keyof Dictionary['quoteInbox']> = {
  blackout_date:   'errBlackout',
  day_unavailable: 'errDayUnavailable',
  outside_hours:   'errOutsideHours',
  time_conflict:   'errTimeConflict',
};

const ACTION_CHIP: Record<OfferPayload['action'], { variant: BadgeVariant; key: keyof Dictionary['negotiation'] }> = {
  offer:   { variant: 'brand',   key: 'chipOffer' },
  counter: { variant: 'warning', key: 'chipCounter' },
  accept:  { variant: 'success', key: 'chipAccepted' },
  decline: { variant: 'danger',  key: 'chipDeclined' },
};

const intlLocale = (locale: Locale) => (locale === 'lt' ? 'lt-LT' : 'en-GB');

const money = (n: number) => `€${n.toFixed(2)}`;

/** Compact price for chips — cents are noise at a glance. */
export const compactMoney = (n: number) => `€${n.toFixed(0)}`;

/**
 * "Expires in 3h" / "Expires in 2d" / "Expired". `urgent` drives the caution
 * tone on the live offer only — history shouldn't shout.
 */
function expiryLabel(
  iso: string,
  s: Dictionary['negotiation'],
): { label: string; urgent: boolean } {
  const ms = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(ms)) return { label: '', urgent: false };
  if (ms <= 0) return { label: s.expired, urgent: true };

  const mins = Math.floor(ms / 60000);
  const value =
    mins < 60  ? `${mins}${s.minutesShort}` :
    mins < 1440 ? `${Math.floor(mins / 60)}${s.hoursShort}` :
    `${Math.floor(mins / 1440)}${s.daysShort}`;

  return { label: `${s.expiresInPrefix} ${value}`, urgent: ms < 24 * 60 * 60 * 1000 };
}

export interface OfferCardProps {
  payload: OfferPayload;
  createdAt: string;
  /** Fallback for authorship when the viewer's side can't be resolved. */
  isMine: boolean;
  otherName: string;
  negotiation?: Negotiation | null;
  viewerSide: Side | null;
  /** True only for the last kind='offer' message in the thread. */
  isLatestOffer: boolean;
  /** Re-fetch the thread + list after an action lands. */
  onActed?: () => void;
  className?: string;
}

export function OfferCard({
  payload,
  createdAt,
  isMine,
  otherName,
  negotiation,
  viewerSide,
  isLatestOffer,
  onActed,
  className,
}: OfferCardProps) {
  const t = useTranslation();
  const s = t.negotiation;
  const { locale } = useLocale();
  const { toast } = useToast();
  const router = useRouter();

  const [pending, setPending] = useState<'accept' | 'decline' | 'counter' | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterNote, setCounterNote] = useState('');
  const [counterError, setCounterError] = useState<string | null>(null);
  // Two cards could in principle both mount a modal; keep the form id unique
  // so the footer submit button never targets a sibling's <form>.
  const uid = useId();
  const counterFormId = `offer-counter-${uid}`;

  const chip = ACTION_CHIP[payload.action];
  const byMe = viewerSide ? payload.by === viewerSide : isMine;

  const isLive =
    isLatestOffer &&
    negotiation?.status === 'PENDING' &&
    negotiation.quoteId === payload.quoteId;
  const canAct = isLive && !!viewerSide && viewerSide === negotiation!.turn;
  const awaitingOther = isLive && !!viewerSide && viewerSide !== negotiation!.turn;

  const expiry = payload.expiresAt ? expiryLabel(payload.expiresAt, s) : null;

  const patch = async (
    action: 'accept' | 'decline' | 'counter',
    extra: Record<string, unknown> = {},
  ): Promise<any | null> => {
    setCardError(null);
    setPending(action);
    try {
      const res = await fetch('/api/quotes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId: payload.quoteId, action, ...extra }),
      });
      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        // Availability conflicts on accept have a code we have real copy for;
        // anything else surfaces the server's own message inside the card so
        // the reason stays next to the offer it's about.
        const mapped = data?.errorCode ? AVAILABILITY_ERROR_KEYS[data.errorCode] : undefined;
        setCardError(mapped ? t.quoteInbox[mapped] : (data?.error ?? s.actionFailed));
        onActed?.();
        return null;
      }
      return data ?? {};
    } catch {
      setCardError(t.common.networkError);
      return null;
    } finally {
      setPending(null);
    }
  };

  const onAccept = async () => {
    const data = await patch('accept');
    if (!data) return;
    // The deposit CTA lives on the booking page — send the customer straight
    // there. The provider has nothing to pay, so just refresh in place.
    if (data.bookingId && viewerSide === 'customer') {
      router.push(`/bookings/${data.bookingId}`);
      return;
    }
    toast.success(s.acceptedToast);
    onActed?.();
  };

  const onDecline = async () => {
    const data = await patch('decline');
    if (!data) return;
    toast.info(s.declinedToast);
    onActed?.();
  };

  const onCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(counterPrice.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) {
      setCounterError(s.counterPriceInvalid);
      return;
    }
    setCounterError(null);
    const data = await patch('counter', {
      price: value,
      note: counterNote.trim() || undefined,
    });
    if (!data) { setCounterOpen(false); return; }
    setCounterOpen(false);
    setCounterPrice('');
    setCounterNote('');
    toast.success(s.counterSentToast);
    onActed?.();
  };

  return (
    <div className={cn('flex mt-3', byMe ? 'justify-end' : 'justify-start', className)}>
      <div
        className={cn(
          'w-full max-w-[26rem] bg-card border border-border rounded-card overflow-hidden',
          // No footer row (history card) → the card still needs a bottom edge.
          !canAct && !awaitingOther && 'pb-4',
        )}
      >
        {/* Header — what this card is, who put it on the table, and when */}
        <div className="flex items-start justify-between gap-3 px-4 pt-3.5">
          <div className="min-w-0">
            <StatusBadge variant={chip.variant} label={s[chip.key]} />
            <p className="text-3xs text-ink-dim mt-1.5 truncate">
              {byMe ? s.byYou : `${s.byPrefix} ${otherName}`}
            </p>
          </div>
          <span className="text-3xs text-ink-dim shrink-0 pt-0.5">
            {new Date(createdAt).toLocaleTimeString(intlLocale(locale), { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Price hero — the number this card put on the table */}
        <p className="px-4 pt-2 text-2xl font-bold tracking-tight text-ink">
          {money(payload.price)}
        </p>

        {/* Quiet meta — est. hours + validity */}
        {(payload.estimatedHours != null || expiry?.label) && (
          <div className="px-4 pt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {payload.estimatedHours != null && (
              <span className="inline-flex items-center gap-1 text-3xs text-ink-dim">
                <Hourglass className="w-3 h-3" aria-hidden="true" />
                {s.estHoursPrefix} {payload.estimatedHours}{s.hoursShort}
              </span>
            )}
            {expiry?.label && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-3xs font-semibold',
                  isLive && expiry.urgent ? 'text-caution' : 'text-ink-dim font-medium',
                )}
              >
                <Clock className="w-3 h-3" aria-hidden="true" />
                {expiry.label}
              </span>
            )}
          </div>
        )}

        {/* Note — already redactPII'd server-side */}
        {payload.note && (
          <p className="mx-4 mt-3 pl-3 border-l-2 border-border-dim text-sm text-ink-sub leading-relaxed whitespace-pre-wrap break-words">
            {payload.note}
          </p>
        )}

        {cardError && (
          <Alert variant="caution" className="mx-4 mt-3">{cardError}</Alert>
        )}

        {/* Action row — only on the live offer, only on the viewer's turn */}
        {canAct && (
          <div className="flex items-center gap-2 px-4 py-3.5 mt-3.5 border-t border-border-dim">
            <Button
              size="sm"
              variant="primary"
              loading={pending === 'accept'}
              disabled={pending !== null}
              onClick={onAccept}
            >
              {s.accept}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={pending !== null}
              onClick={() => { setCounterError(null); setCounterOpen(true); }}
            >
              {s.counter}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              loading={pending === 'decline'}
              disabled={pending !== null}
              onClick={onDecline}
            >
              {s.decline}
            </Button>
          </div>
        )}

        {awaitingOther && (
          <p className="px-4 py-3 mt-3.5 border-t border-border-dim text-3xs italic text-ink-dim">
            {`${s.waitingPrefix} ${otherName} ${s.waitingSuffix}`}
          </p>
        )}
      </div>

      {/* Counter modal — same form for both sides */}
      <Modal
        open={counterOpen}
        onClose={() => setCounterOpen(false)}
        title={s.counterTitle}
        description={s.counterDesc}
        size="sm"
        footer={
          <ModalFooter>
            <Button variant="ghost" onClick={() => setCounterOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button
              type="submit"
              form={counterFormId}
              loading={pending === 'counter'}
            >
              {s.counterSubmit}
            </Button>
          </ModalFooter>
        }
      >
        <form id={counterFormId} onSubmit={onCounter} className="space-y-4">
          <Input
            label={s.counterPriceLabel}
            type="number"
            inputMode="decimal"
            min="1"
            step="1"
            value={counterPrice}
            onChange={(e) => setCounterPrice(e.target.value)}
            leading={<span className="text-sm font-semibold">€</span>}
            error={counterError ?? undefined}
            hint={s.counterPriceHint}
            autoFocus
          />
          <Textarea
            label={s.counterNoteLabel}
            labelNote={t.common.optional}
            rows={3}
            value={counterNote}
            onChange={(e) => setCounterNote(e.target.value)}
            hint={s.counterNoteHint}
          />
        </form>
      </Modal>
    </div>
  );
}

export default OfferCard;
