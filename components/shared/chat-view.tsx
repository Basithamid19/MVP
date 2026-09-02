'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  Send, Loader2, ArrowLeft, Phone, ImagePlus, X, XCircle,
  CheckCircle2, Calendar, Star, Clock, MessageCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar, EmptyState, buttonVariants, useToast } from '@/components/ui';
import {
  OfferCard, OfferEventRow, asOfferPayload, asSystemPayload, offerPayloadFromNegotiation,
  viewerSideOf, type Negotiation, type Side, type SystemPayload,
} from '@/components/OfferCard';
import { cn } from '@/lib/utils';
import { useLocale, useTranslation } from '@/lib/i18n';
import type { Dictionary, Locale } from '@/lib/i18n/types';
import { useVisibleInterval } from '@/lib/use-visible-interval';

/* ─── Chat ──────────────────────────────────────────────────────────────────
 * ONE chat visual language for the whole product. This module owns the parts
 * that both chat surfaces render — the message stream (`MessageThread`) and
 * the composer (`ChatComposer`) — so /messages and the booking/job chat
 * overlay can never drift apart again.
 *
 * Bubbles: outgoing bg-brand / incoming bg-card + border. Consecutive messages
 * from the same sender group (tight spacing, one timestamp on the last row,
 * one avatar beside the first incoming row). Day boundaries get a separator.
 *
 * Send/upload paths are untouched API-wise: POST /api/chat (content is
 * redacted server-side by redactPII) and POST /api/uploads for attachments.
 * ────────────────────────────────────────────────────────────────────────── */

/** Sentinel content persisted with image messages — never translate it. */
const PHOTO_SENTINEL = '📷 Photo';

/** Messages this far apart start a new visual group even for the same sender. */
const GROUP_GAP_MS = 5 * 60 * 1000;

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  isSystem?: boolean;
  /** 20260710 negotiation columns. Absent/legacy rows read as 'text'. */
  kind?: 'text' | 'offer' | 'system';
  /** Structured card data — shape depends on `kind`. See OfferCard. */
  payload?: unknown;
}

/** Anything other than 'text' renders as a card/chip, not a bubble. */
const messageKind = (msg: ChatMessage): 'text' | 'offer' | 'system' =>
  msg.kind === 'offer' || msg.kind === 'system' ? msg.kind : 'text';

interface SystemEvent {
  id: string;
  type: 'quote_sent' | 'quote_accepted' | 'booking_confirmed' | 'job_started' | 'job_completed' | 'review_left';
  detail?: string;
  timestamp: string;
}

const EVENT_ICONS: Record<SystemEvent['type'], React.ElementType> = {
  quote_sent: Clock,
  quote_accepted: CheckCircle2,
  booking_confirmed: Calendar,
  job_started: Clock,
  job_completed: CheckCircle2,
  review_left: Star,
};

/* Token surfaces only — the old raw blue/green/orange/yellow + solid black
   chip palette is gone. */
const EVENT_COLORS: Record<SystemEvent['type'], string> = {
  quote_sent:        'bg-info-surface text-info border-info-edge',
  quote_accepted:    'bg-trust-surface text-trust border-trust-edge',
  booking_confirmed: 'bg-brand-muted text-brand border-brand/20',
  job_started:       'bg-caution-surface text-caution border-caution-edge',
  job_completed:     'bg-trust-surface text-trust border-trust-edge',
  review_left:       'bg-brand-muted text-brand border-brand/20',
};

function eventLabel(event: SystemEvent, t: Dictionary): string {
  const base: Record<SystemEvent['type'], string> = {
    quote_sent:        t.chatView.eventQuoteSent,
    quote_accepted:    t.chatView.eventQuoteAccepted,
    booking_confirmed: t.chatView.eventBookingConfirmed,
    job_started:       t.chatView.eventJobStarted,
    job_completed:     t.chatView.eventJobCompleted,
    review_left:       t.chatView.eventReviewLeft,
  };
  return event.detail ? `${base[event.type]}: ${event.detail}` : base[event.type];
}

// Build the system event timeline from booking state.
function buildTimeline(booking?: any): SystemEvent[] {
  if (!booking) return [];
  const events: SystemEvent[] = [];
  const base = booking.createdAt ?? new Date().toISOString();
  events.push({ id: 'e1', type: 'quote_sent', timestamp: base });
  if (booking.status !== 'SCHEDULED' || booking.createdAt) {
    events.push({ id: 'e2', type: 'quote_accepted', timestamp: base });
    events.push({ id: 'e3', type: 'booking_confirmed', timestamp: base });
  }
  if (booking.status === 'IN_PROGRESS' || booking.status === 'COMPLETED') {
    events.push({ id: 'e4', type: 'job_started', timestamp: booking.scheduledAt ?? base });
  }
  if (booking.status === 'COMPLETED') {
    events.push({ id: 'e5', type: 'job_completed', timestamp: booking.updatedAt ?? base });
  }
  if (booking.review) {
    events.push({ id: 'e6', type: 'review_left', detail: `${booking.review.rating}/5`, timestamp: booking.review.createdAt ?? base });
  }
  return events;
}

/* ─── Day separators + sender grouping ──────────────────────────────────── */

const intlLocale = (locale: Locale) => (locale === 'lt' ? 'lt-LT' : 'en-GB');

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function daySeparatorLabel(date: Date, t: Dictionary, locale: Locale): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (dayKey(date) === dayKey(today)) return t.chatView.today;
  if (dayKey(date) === dayKey(yesterday)) return t.chatView.yesterday;

  return date.toLocaleDateString(intlLocale(locale), {
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() === today.getFullYear() ? {} : { year: 'numeric' }),
  });
}

function clockTime(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleTimeString(intlLocale(locale), { hour: '2-digit', minute: '2-digit' });
}

interface RenderRow {
  msg: ChatMessage;
  isMine: boolean;
  separator: string | null;
  firstOfGroup: boolean;
  lastOfGroup: boolean;
}

function buildRows(
  messages: ChatMessage[],
  currentUserId: string | undefined,
  t: Dictionary,
  locale: Locale,
): RenderRow[] {
  return messages.map((msg, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const date = new Date(msg.createdAt);
    const isMine = !!currentUserId && msg.senderId === currentUserId;

    const newDay = !prev || dayKey(new Date(prev.createdAt)) !== dayKey(date);
    // An offer card / system chip between two texts breaks the visual group:
    // without this the text after it inherits the group and loses its avatar
    // and timestamp.
    const brokeFromPrev =
      newDay ||
      messageKind(prev) !== 'text' ||
      prev.senderId !== msg.senderId ||
      date.getTime() - new Date(prev.createdAt).getTime() > GROUP_GAP_MS;
    const breaksToNext =
      !next ||
      dayKey(new Date(next.createdAt)) !== dayKey(date) ||
      messageKind(next) !== 'text' ||
      next.senderId !== msg.senderId ||
      new Date(next.createdAt).getTime() - date.getTime() > GROUP_GAP_MS;

    return {
      msg,
      isMine,
      separator: newDay ? daySeparatorLabel(date, t, locale) : null,
      firstOfGroup: brokeFromPrev,
      lastOfGroup: breaksToNext,
    };
  });
}

/* ─── System chips ──────────────────────────────────────────────────────────
 * Persisted kind='system' milestones (written by /api/quotes and the Stripe
 * webhook). Distinct from the synthetic buildTimeline events above, which are
 * derived from booking state for legacy deals.
 * ────────────────────────────────────────────────────────────────────────── */

const SYSTEM_EVENT: Record<
  SystemPayload['event'],
  { Icon: React.ElementType; tone: string; key: keyof Dictionary['negotiation'] }
> = {
  booking_created:     { Icon: Calendar,     tone: 'bg-brand-muted text-brand border-brand/20',      key: 'systemBookingCreated' },
  deposit_paid:        { Icon: CheckCircle2, tone: 'bg-trust-surface text-trust border-trust-edge',  key: 'systemDepositPaid' },
  quote_auto_declined: { Icon: XCircle,      tone: 'bg-surface-alt text-ink-sub border-border',      key: 'systemQuoteAutoDeclined' },
};

function SystemChip({
  payload,
  viewerSide,
  t,
}: {
  payload: SystemPayload;
  viewerSide: Side | null;
  t: Dictionary;
}) {
  const { Icon, tone, key } = SYSTEM_EVENT[payload.event];
  // The deposit lives on the booking page; only the paying side gets the CTA.
  const showPay =
    payload.event === 'booking_created' && !!payload.bookingId && viewerSide === 'customer';

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-chip border',
          'text-2xs font-bold uppercase tracking-wide text-center',
          tone,
        )}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        {t.negotiation[key]}
      </span>
      {showPay && (
        <Link
          href={`/bookings/${payload.bookingId}`}
          className={buttonVariants({ variant: 'primary', size: 'sm' })}
        >
          {t.negotiation.payDeposit}
        </Link>
      )}
    </div>
  );
}

/* ─── MessageThread ─────────────────────────────────────────────────────────
 * The message stream itself. Callers own the scroll container and its
 * padding; this renders the separators + grouped bubbles inside it.
 *
 * Three message kinds share the stream: 'text' bubbles, 'offer' cards (the
 * negotiation itself) and 'system' chips (booking created / deposit paid /
 * auto-decline). An offer/system row whose payload is missing or malformed
 * falls back to a plain bubble showing `content` — the server mirrors every
 * payload as text precisely so that fallback still says something true.
 *
 * BACKSTOP: the offer cards are best-effort writes, so the stream can be
 * missing the card for a negotiation that is very much live. Whenever
 * `negotiation` points at a quote with no card in the stream, one is
 * SYNTHESIZED from the negotiation state and appended — same OfferCard, same
 * action row, same handlers. A negotiation is therefore always actionable in
 * its own thread, and a settled one always leaves a summary behind, no matter
 * what happened to the message rows.
 * ────────────────────────────────────────────────────────────────────────── */

export function MessageThread({
  messages,
  currentUserId,
  otherName,
  otherImage,
  negotiation,
  onActed,
  hideEmptyState = false,
  className,
}: {
  messages: ChatMessage[];
  currentUserId?: string;
  otherName: string;
  otherImage?: string | null;
  /** Live negotiation for this thread, from GET /api/chat?threadId. */
  negotiation?: Negotiation | null;
  /** Called after an offer action lands, so the caller can re-fetch. */
  onActed?: () => void;
  /**
   * Suppress the "start the conversation" empty state — for surfaces that
   * already render their own context above the stream (the pinned RequestCard
   * in /messages), where a second empty slab reads as a dead end.
   */
  hideEmptyState?: boolean;
  className?: string;
}) {
  const t = useTranslation();
  const { locale } = useLocale();
  const { data: session } = useSession();

  const rows = useMemo(
    () => buildRows(messages, currentUserId, t, locale),
    [messages, currentUserId, t, locale],
  );

  // Which side of the negotiation the viewer is on. The negotiation payload is
  // authoritative and now persists past accept/decline (it carries the latest
  // quote whatever its status), so this normally resolves from it; the session
  // role is the fallback for a thread that never had a quote, or a pre-
  // negotiation API shape that returns no negotiation at all.
  // Caveat: an ADMIN spectator resolves to 'customer' whenever a negotiation
  // is present — read-only in practice (the action row also requires PENDING
  // plus the turn), but it does surface the customer's deposit CTA.
  const sessionRole = (session?.user as any)?.role;
  const viewerSide: Side | null =
    viewerSideOf(currentUserId, negotiation) ??
    (sessionRole === 'PROVIDER' ? 'provider' : sessionRole === 'CUSTOMER' ? 'customer' : null);

  // Only the LAST offer message can be actionable — everything above it is
  // superseded history.
  const latestOfferId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messageKind(messages[i]) === 'offer' && asOfferPayload(messages[i].payload)) {
        return messages[i].id;
      }
    }
    return null;
  }, [messages]);

  // The backstop card: rebuilt from negotiation state when the stream has no
  // card for the negotiation's quote. Never rendered when the real card is
  // present, so a healthy thread looks exactly as before.
  const syntheticOffer = useMemo(() => {
    if (!negotiation?.quoteId) return null;
    const hasCard = messages.some(
      m => messageKind(m) === 'offer' && asOfferPayload(m.payload)?.quoteId === negotiation.quoteId,
    );
    return hasCard ? null : offerPayloadFromNegotiation(negotiation);
  }, [messages, negotiation]);

  if (messages.length === 0 && !syntheticOffer) {
    if (hideEmptyState) return null;
    return (
      <EmptyState
        icon={MessageCircle}
        title={t.chatView.emptyTitle}
        description={t.chatView.emptyDesc}
        className={className}
      />
    );
  }

  return (
    <div className={className}>
      {rows.map(({ msg, isMine, separator, firstOfGroup, lastOfGroup }) => {
        const kind = messageKind(msg);
        const offer = kind === 'offer' ? asOfferPayload(msg.payload) : null;
        const system = kind === 'system' ? asSystemPayload(msg.payload) : null;

        const daySeparator = separator && (
          <div className="flex items-center justify-center py-4">
            <span className="px-3 py-1 rounded-chip bg-surface-alt text-ink-dim text-2xs font-bold uppercase tracking-widest">
              {separator}
            </span>
          </div>
        );

        if (offer) {
          // Superseded offers collapse to a timeline row — only the live one is
          // a card, so the thread reads as a sequence of moves, not a stack of
          // near-identical price slabs.
          const isLatest = msg.id === latestOfferId;
          return (
            <React.Fragment key={msg.id}>
              {daySeparator}
              {isLatest ? (
                <OfferCard
                  payload={offer}
                  createdAt={msg.createdAt}
                  isMine={isMine}
                  otherName={otherName}
                  negotiation={negotiation}
                  viewerSide={viewerSide}
                  isLatestOffer
                  onActed={onActed}
                />
              ) : (
                <OfferEventRow
                  payload={offer}
                  createdAt={msg.createdAt}
                  isMine={isMine}
                  otherName={otherName}
                  viewerSide={viewerSide}
                />
              )}
            </React.Fragment>
          );
        }

        if (system) {
          return (
            <React.Fragment key={msg.id}>
              {daySeparator}
              <SystemChip payload={system} viewerSide={viewerSide} t={t} />
            </React.Fragment>
          );
        }

        return (
        <React.Fragment key={msg.id}>
          {daySeparator}

          <div
            className={cn(
              'flex items-end',
              isMine ? 'justify-end' : 'justify-start',
              firstOfGroup && !separator ? 'mt-3' : 'mt-0.5',
            )}
          >
            {/* Avatar rail — one avatar per incoming group, spacer otherwise */}
            {!isMine && (
              <div className="w-8 shrink-0 mr-2">
                {firstOfGroup && <Avatar src={otherImage} name={otherName} size="sm" />}
              </div>
            )}

            <div
              className={cn(
                'max-w-[75%] overflow-hidden',
                isMine
                  ? 'bg-brand text-white rounded-card rounded-br-md'
                  : 'bg-card border border-border-dim text-ink rounded-card rounded-bl-md',
              )}
            >
              {msg.imageUrl && (
                <img
                  src={msg.imageUrl}
                  alt={t.chatView.sharedPhoto}
                  className="w-full max-w-[240px] object-cover"
                />
              )}

              {(!msg.imageUrl || msg.content !== PHOTO_SENTINEL) && (
                <div className="px-3.5 py-2.5 text-sm leading-relaxed">
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  {lastOfGroup && (
                    <p className={cn('text-3xs mt-1', isMine ? 'text-white/60' : 'text-ink-dim')}>
                      {clockTime(msg.createdAt, locale)}
                    </p>
                  )}
                </div>
              )}

              {msg.imageUrl && msg.content === PHOTO_SENTINEL && lastOfGroup && (
                <p className={cn('px-3.5 pb-2 pt-1 text-3xs', isMine ? 'text-white/60' : 'text-ink-dim')}>
                  {clockTime(msg.createdAt, locale)}
                </p>
              )}
            </div>
          </div>
        </React.Fragment>
        );
      })}

      {syntheticOffer && (
        <OfferCard
          payload={syntheticOffer}
          createdAt={negotiation?.createdAt ?? new Date().toISOString()}
          // Authorship comes from payload.by vs viewerSide; isMine is only the
          // no-viewer-side (admin spectator) fallback.
          isMine={false}
          otherName={otherName}
          negotiation={negotiation}
          viewerSide={viewerSide}
          isLatestOffer
          onActed={onActed}
        />
      )}
    </div>
  );
}

/* ─── ChatComposer ──────────────────────────────────────────────────────────
 * THE composer. Owns its draft, the /api/uploads → /api/chat attachment path
 * and failure toasts; callers just receive the created message.
 *
 * `mode` — 'text' (default: input + photo button) or 'structured' for a
 * pre-deposit thread, where free text is still gated server-side. Structured
 * mode renders NOTHING: pre-deposit the offer cards in the stream ARE the
 * conversation, so the composer simply doesn't exist yet.
 *
 * It used to render a notice explaining that messaging was locked. That copy is
 * gone by founder decision — we never tell either side the chat is locked; the
 * absence of an input says everything true about it, and the next real step
 * (send a quote / respond to the offer / pay the deposit) is already stated on
 * the RequestCard, the offer card and the system chips above.
 * ────────────────────────────────────────────────────────────────────────── */

export function ChatComposer({
  threadId,
  onSent,
  onLocked,
  mode = 'text',
  className,
}: {
  threadId: string;
  onSent: (message: ChatMessage) => void;
  onLocked?: () => void;
  mode?: 'text' | 'structured';
  className?: string;
}) {
  const t = useTranslation();
  const { toast } = useToast();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!draft.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, content: draft.trim() }),
      });
      if (res.status === 403) {
        const data = await res.json().catch(() => ({} as any));
        // A surface that can render a lock state handles it itself; otherwise
        // the reason still has to reach the user.
        if (data.locked && onLocked) onLocked();
        else toast.error(data.error ?? t.messagesPage.sendFailed);
        return;
      }
      if (!res.ok) {
        // Keep the draft so the user can retry; surface why it failed.
        const data = await res.json().catch(() => ({} as any));
        toast.error(data.error ?? t.messagesPage.sendFailed);
        return;
      }
      setDraft('');
      onSent(await res.json());
    } catch {
      toast.error(t.messagesPage.sendFailedNetwork);
    } finally {
      setSending(false);
    }
  };

  const attach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const uploadRes = await fetch('/api/uploads', { method: 'POST', body: fd });
      if (!uploadRes.ok) throw new Error('upload failed');
      const uploaded = await uploadRes.json();

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, content: PHOTO_SENTINEL, imageUrl: uploaded.url }),
      });
      if (res.status === 403) {
        const data = await res.json().catch(() => ({} as any));
        if (data.locked && onLocked) onLocked();
        else toast.error(data.error ?? t.chatView.uploadFailed);
        return;
      }
      if (!res.ok) {
        toast.error(t.chatView.uploadFailed);
        return;
      }
      const msg = await res.json();
      onSent({ ...msg, imageUrl: uploaded.url });
    } catch {
      toast.error(t.chatView.uploadFailed);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Pre-deposit: no composer at all. The cards in the stream carry the turn.
  if (mode === 'structured') return null;

  return (
    <form onSubmit={send} className={cn('flex items-center gap-2', className)}>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={attach} />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        title={t.chatView.attachPhoto}
        aria-label={t.chatView.attachPhoto}
        className="w-11 h-11 shrink-0 flex items-center justify-center rounded-input bg-surface-alt border border-border-dim text-ink-sub hover:text-brand hover:border-brand hover:bg-brand-muted transition-colors disabled:opacity-50"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
      </button>

      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={t.messagesPage.typeMessage}
        aria-label={t.messagesPage.typeMessage}
        className="flex-1 min-w-0 px-4 py-3 bg-card border border-border rounded-input text-sm text-ink placeholder:text-ink-dim outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:border-brand transition-colors"
      />

      <button
        type="submit"
        disabled={sending || !draft.trim()}
        aria-label={t.messagesPage.typeMessage}
        className="w-11 h-11 shrink-0 flex items-center justify-center rounded-input bg-brand text-white hover:bg-brand-dark transition-colors disabled:opacity-50"
      >
        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
      </button>
    </form>
  );
}

/* ─── ChatPage — full-screen conversation for booking / job detail ───────── */

export default function ChatPage({ threadId, booking }: { threadId: string; booking?: any }) {
  const { data: session } = useSession();
  const t = useTranslation();
  const { locale } = useLocale();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showTimeline, setShowTimeline] = useState(false);
  // Locked until the booking is confirmed (deposit held / job progressed) —
  // mirrors the server-side gate in lib/chat-access.ts.
  const [isLocked, setIsLocked] = useState(
    !(
      ['DEPOSIT_HELD', 'PAID', 'PROCESSING'].includes(booking?.payment?.status) ||
      ['IN_PROGRESS', 'COMPLETED'].includes(booking?.status)
    )
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const userId = (session?.user as any)?.id;
  const viewerIsProvider = (session?.user as any)?.role === 'PROVIDER';

  // The counterpart is whoever the viewer is not — the header used to always
  // name the provider, so pros saw their own name at the top of the thread.
  const counterpart = viewerIsProvider ? booking?.customer?.user : booking?.provider?.user;
  const counterpartName = counterpart?.name ?? (viewerIsProvider ? t.chatView.roleCustomer : t.chatView.roleProvider);
  const counterpartSubtitle =
    booking?.quote?.request?.category?.name ??
    (viewerIsProvider ? t.chatView.roleCustomer : t.chatView.roleProvider);

  const providerPhone = booking?.provider?.phone ?? null;
  const timeline = buildTimeline(booking);

  // Initial fetch happens on thread change; the 3s poll is visibility-gated so
  // a backgrounded tab doesn't keep hitting /api/chat.
  const fetchMessagesRef = useRef<() => void>(() => {});
  useEffect(() => {
    let cancelled = false;
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat?threadId=${threadId}`);
        if (cancelled) return;
        const data = await res.json();
        // GET ?threadId returns { messages, textUnlocked, negotiation } as of
        // the negotiation change; it used to return a bare array. Accept both.
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.messages) ? data.messages : null;
        if (!cancelled && list) setMessages(list);
      } catch (error) {
        console.error('Failed to fetch messages', error);
      }
    };

    fetchMessagesRef.current = fetchMessages;
    fetchMessages();
    return () => { cancelled = true; fetchMessagesRef.current = () => {}; };
  }, [threadId]);

  useVisibleInterval(() => fetchMessagesRef.current(), threadId ? 3000 : null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCall = () => {
    if (providerPhone) {
      window.location.href = `tel:${providerPhone}`;
    } else {
      toast.info(t.bookingDetail.callMasking);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-canvas">
      {/* Header */}
      <div className="bg-card border-b border-border-dim px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-surface-alt rounded-full transition-colors shrink-0 text-ink-sub hover:text-ink"
          aria-label={t.common.back}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <Avatar src={counterpart?.image} name={counterpartName} size="md" />

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-ink truncate">{counterpartName}</div>
          <div className="text-3xs text-ink-dim truncate">{counterpartSubtitle}</div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {timeline.length > 0 && (
            <button
              onClick={() => setShowTimeline(!showTimeline)}
              className={cn(
                'p-2 rounded-full transition-colors',
                showTimeline ? 'bg-brand text-white' : 'bg-surface-alt text-ink-sub hover:text-ink',
              )}
              title={t.chatView.eventTimeline}
              aria-label={t.chatView.eventTimeline}
            >
              <Clock className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleCall}
            className="p-2 bg-trust-surface hover:bg-trust-edge/60 text-trust rounded-full transition-colors"
            title={t.chatView.callAction}
            aria-label={t.chatView.callAction}
          >
            <Phone className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* System event timeline panel */}
      {showTimeline && timeline.length > 0 && (
        <div className="bg-card border-b border-border-dim px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-2xs font-bold text-ink-dim uppercase tracking-widest">{t.chatView.eventTimeline}</p>
            <button
              onClick={() => setShowTimeline(false)}
              className="text-ink-dim hover:text-ink transition-colors"
              aria-label={t.chatView.closeTimeline}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <div className="absolute left-3.5 top-2 bottom-2 w-px bg-border-dim" />
            <div className="space-y-3">
              {timeline.map((event) => {
                const Icon = EVENT_ICONS[event.type];
                return (
                  <div key={event.id} className="flex items-center gap-3 relative">
                    <div className={cn('w-7 h-7 rounded-full border flex items-center justify-center shrink-0 z-10', EVENT_COLORS[event.type])}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink">{eventLabel(event, t)}</p>
                      <p className="text-3xs text-ink-dim">
                        {new Date(event.timestamp).toLocaleDateString(intlLocale(locale), {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <MessageThread
          messages={messages}
          currentUserId={userId}
          otherName={counterpartName}
          otherImage={counterpart?.image}
        />
      </div>

      {/* Composer — pre-deposit there is none, and no banner explaining its
          absence either. The deposit CTA already lives on the booking page and
          on the booking_created chip in the stream above. */}
      {!isLocked && (
        <div className="p-4 bg-card border-t border-border-dim">
          <ChatComposer
            threadId={threadId}
            className="max-w-4xl mx-auto"
            onSent={(msg) => setMessages(prev => [...prev, msg])}
            onLocked={() => setIsLocked(true)}
          />
        </div>
      )}
    </div>
  );
}
