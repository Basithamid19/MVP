'use client';

import React, { Suspense, useCallback, useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, MessageCircle, AlertCircle } from 'lucide-react';
import CustomerLayout from '@/components/CustomerLayout';
import { Alert, Avatar, EmptyState, PageHeader, StatusBadge } from '@/components/ui';
import type { BadgeVariant } from '@/components/ui';
import { ChatComposer, MessageThread, type ChatMessage } from '@/components/shared/chat-view';
import { compactMoney, viewerSideOf, type Negotiation } from '@/components/OfferCard';
import { RequestCard, asThreadRequest, type ThreadRequest } from '@/components/RequestCard';
import { useTranslation } from '@/lib/i18n';
import type { Dictionary } from '@/lib/i18n/types';
import { fetchJsonWithRetry, isDefinitiveError } from '@/lib/fetch-retry';
import { useVisibleInterval } from '@/lib/use-visible-interval';

function timeAgo(date: string, s: Dictionary['messagesPage']) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return s.justNow;
  if (mins < 60) return `${s.agoPrefix}${mins}${s.minutesSuffix}`;
  if (mins < 1440) return `${s.agoPrefix}${Math.floor(mins / 60)}${s.hoursSuffix}`;
  return `${s.agoPrefix}${Math.floor(mins / 1440)}${s.daysSuffix}`;
}

interface Thread {
  id: string;
  /** The ServiceRequest this conversation is about (20260710 payload). */
  requestId?: string;
  otherParticipant: { id: string; name: string | null; image: string | null; role: string };
  lastMessage: {
    content: string;
    senderId: string;
    createdAt: string;
    kind?: 'text' | 'offer' | 'system';
  } | null;
  category: string;
  createdAt: string;
  unreadCount?: number;
  /** Free text allowed? False while the deposit is unpaid. */
  textUnlocked?: boolean;
  negotiation?: Negotiation | null;
  /** The job this conversation is about (20260711 payload). */
  request?: ThreadRequest | null;
}

/**
 * Inbox preview line. Offer/system messages persist their payload mirrored as
 * raw text ('[counter] €45', '[system] booking_created') so text-only clients
 * show something — but that's debug copy for a human reading the inbox, and
 * the negotiation chip below already carries the price.
 */
function previewLine(thread: Thread, t: Dictionary): string | null {
  const last = thread.lastMessage;
  if (!last) {
    // A direct-request thread exists before anyone has said anything. "No
    // messages yet" made that row look broken; name the job instead.
    if (!thread.request) return null;
    const category = thread.request.categoryName ?? thread.category;
    return category
      ? `${t.negotiation.previewNewRequest} · ${category}`
      : t.negotiation.previewNewRequest;
  }
  if (last.kind === 'offer') return t.negotiation.previewOffer;
  if (last.kind === 'system') return t.negotiation.previewSystem;
  return last.content;
}

/**
 * One-line negotiation chip for a thread row: where the money currently
 * stands, and whether the viewer owes a response.
 *
 * Settled deals keep their chip forever — /api/chat returns the latest quote
 * whatever its status, so a booked thread reads '€120 · Accepted' rather than
 * losing the figure the moment the negotiation ends. Only PENDING carries a
 * turn indicator; there's nothing left to answer on the others.
 */
function negotiationChip(
  thread: Thread,
  userId: string | undefined,
  t: Dictionary,
): { variant: BadgeVariant; label: string } | null {
  const n = thread.negotiation;
  if (!n) return null;

  const price = compactMoney(n.effectivePrice);
  if (n.status === 'ACCEPTED') return { variant: 'success', label: `${price} · ${t.negotiation.chipAccepted}` };
  if (n.status === 'DECLINED') return { variant: 'neutral', label: `${price} · ${t.negotiation.chipDeclined}` };
  if (n.status !== 'PENDING')   return { variant: 'neutral', label: `${price} · ${t.negotiation.expired}` };

  const side = viewerSideOf(userId, n);
  const yours = !!side && side === n.turn;
  return {
    variant: yours ? 'warning' : 'neutral',
    label: `${price} · ${yours ? t.negotiation.yourTurn : t.negotiation.waiting}`,
  };
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <CustomerLayout flush>
        <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-ink-dim" /></div>
      </CustomerLayout>
    }>
      <MessagesContent />
    </Suspense>
  );
}

/* ─── ThreadList ────────────────────────────────────────────────────────────
 * ONE thread list, rendered by both the mobile inbox card and the desktop
 * sidebar — the two used to be ~30 duplicated lines that drifted apart.
 * ────────────────────────────────────────────────────────────────────────── */

function ThreadList({
  threads,
  activeThreadId,
  userId,
  t,
  className,
}: {
  threads: Thread[];
  activeThreadId: string | null;
  userId?: string;
  t: Dictionary;
  className?: string;
}) {
  return (
    <div className={className}>
      {threads.map(th => {
        // Unread only counts while the thread is closed — the open thread is
        // being marked read by its own poll.
        const unread = (th.unreadCount ?? 0) > 0 && th.id !== activeThreadId;
        const preview = previewLine(th, t);
        const chip = negotiationChip(th, userId, t);
        return (
          <Link
            key={th.id}
            href={`/messages?thread=${th.id}`}
            className={`flex items-start gap-3.5 sm:gap-4 px-4 sm:px-5 py-5 transition-colors ${
              th.id === activeThreadId ? 'bg-brand-muted' : 'hover:bg-surface-alt'
            }`}
          >
            <Avatar
              src={th.otherParticipant.image}
              name={th.otherParticipant.name ?? ''}
              size="lg"
              className="w-12 h-12 mt-0.5"
            />
            <div className="flex-1 min-w-0">
              {/* Name + NEW badge + relative time on one baseline */}
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex items-baseline gap-2 min-w-0">
                  <p className="text-base font-bold text-ink truncate">{th.otherParticipant.name}</p>
                  {unread && (
                    <StatusBadge variant="brandSolid" label={t.messagesPage.newBadge} className="shrink-0 -translate-y-px" />
                  )}
                </span>
                {th.lastMessage && (
                  <span className={`text-sm shrink-0 ${unread ? 'text-ink font-semibold' : 'text-ink-dim'}`}>
                    {timeAgo(th.lastMessage.createdAt, t.messagesPage)}
                  </span>
                )}
              </div>

              {/* Context line — what this conversation is about */}
              <p className="text-sm text-ink-sub font-medium mt-0.5 truncate">{th.category}</p>

              {/* Two-line message preview — bold while unread */}
              {preview ? (
                <p className={`text-sm mt-1.5 leading-relaxed line-clamp-2 ${
                  unread ? 'text-ink font-semibold' : 'text-ink-sub'
                }`}>
                  {th.lastMessage?.senderId === userId ? t.messagesPage.youPrefix : ''}
                  {preview}
                </p>
              ) : (
                <p className="text-sm text-ink-dim mt-1.5">{t.messagesPage.noMessagesShort}</p>
              )}

              {/* Where the money stands + whose move it is */}
              {chip && (
                <p className="mt-2">
                  <StatusBadge variant={chip.variant} label={chip.label} className="max-w-full overflow-hidden" />
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/* ─── ConversationPane ──────────────────────────────────────────────────────
 * ONE conversation surface — the mobile full-screen overlay and the desktop
 * right pane render the same header / MessageThread / ChatComposer stack.
 * ────────────────────────────────────────────────────────────────────────── */

function ConversationPane({
  thread,
  messages,
  msgLoading,
  msgError,
  userId,
  negotiation,
  request,
  viewerIsProvider,
  textUnlocked,
  onActed,
  t,
  onBack,
  onSent,
  className,
}: {
  thread: Thread;
  messages: ChatMessage[];
  msgLoading: boolean;
  /** The message fetch failed — say so instead of faking an empty thread. */
  msgError: boolean;
  userId?: string;
  negotiation: Negotiation | null;
  /** The job this thread is anchored on — pinned above the stream. */
  request: ThreadRequest | null;
  viewerIsProvider: boolean;
  /** Free text allowed? Drives the composer mode. */
  textUnlocked: boolean;
  /** Immediate re-fetch of thread + list after an offer action. */
  onActed: () => void;
  t: Dictionary;
  onBack?: () => void;
  onSent: (msg: ChatMessage) => void;
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const name = thread.otherParticipant.name ?? '';
  // Any quote at all retires the "Send your quote" CTA: POST /api/quotes
  // enforces one quote per provider per request, so re-offering after a decline
  // would 409 in the builder. The synthesized summary card in the stream is
  // what explains a settled negotiation instead.
  const offerOnTable = !!negotiation;

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-border-dim bg-card shrink-0">
        {onBack && (
          <button onClick={onBack} className="text-ink-sub hover:text-ink transition-colors" aria-label={t.common.back}>
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <Avatar src={thread.otherParticipant.image} name={name} size="md" className="w-9 h-9" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-ink truncate">{name}</p>
          <p className="text-3xs text-ink-dim truncate">{thread.category}</p>
        </div>
      </div>

      {/* Messages — the job is pinned above the stream, and is the ONLY
          content a fresh direct-request thread has. */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 bg-canvas">
        {request && (
          <RequestCard
            request={request}
            viewerIsProvider={viewerIsProvider}
            otherName={name}
            offerOnTable={offerOnTable}
            className="mb-2"
          />
        )}
        {msgError && (
          <Alert variant="caution" icon={AlertCircle} className="mb-2">
            {t.messagesPage.loadErrorDesc}
          </Alert>
        )}
        {msgLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-ink-dim" />
          </div>
        ) : (
          <MessageThread
            messages={messages}
            currentUserId={userId}
            otherName={name}
            otherImage={thread.otherParticipant.image}
            negotiation={negotiation}
            onActed={onActed}
            hideEmptyState={!!request}
          />
        )}
      </div>

      {/* Composer — free text only once the deposit is paid. Before that the
          slot is absent entirely (bar included): the offer cards in the stream
          are the conversation, and we never tell either side it's "locked". */}
      {textUnlocked && (
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-t border-border-dim bg-card shrink-0">
          <ChatComposer
            threadId={thread.id}
            onSent={onSent}
            mode={textUnlocked ? 'text' : 'structured'}
          />
        </div>
      )}
    </div>
  );
}

function MessagesContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslation();
  const searchParams = useSearchParams();
  const activeThreadId = searchParams.get('thread');

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgError, setMsgError] = useState(false);
  const [negotiation, setNegotiation] = useState<Negotiation | null>(null);
  const [detailRequest, setDetailRequest] = useState<ThreadRequest | null>(null);
  const [detailUnlocked, setDetailUnlocked] = useState<boolean | null>(null);
  // Bumped by offer actions so both polls re-run immediately instead of
  // leaving the user staring at stale state for up to 15s.
  const [refreshKey, setRefreshKey] = useState(0);
  // "Have we ever got a good answer out of /api/chat?" Error banners are gated
  // on this: a poll that fails over an inbox that already rendered must stay
  // silent, and a deep link must not be declared unreachable just because the
  // list fetch is still failing.
  const threadsLoadedRef = useRef(false);
  // Same idea for the open thread — set false on every thread switch.
  const detailLoadedRef = useRef(false);
  const userId = (session?.user as any)?.id;
  const isProvider = (session?.user as any)?.role === 'PROVIDER';

  const refreshNow = useCallback(() => setRefreshKey(k => k + 1), []);

  // Stable ref to the latest thread-list fetch. Owned by the effect below so
  // its `cancelled` scope stays valid; called from useVisibleInterval so the
  // 15s poll pauses on backgrounded tabs and refreshes once on tab-return.
  const fetchThreadsRef = useRef<() => void>(() => {});

  // middleware owns the auth gate here; client 'unauthenticated' may be transient.

  // Fetch thread list. The initial call happens here (with cancelled-scoped
  // state guards); the periodic refresh runs via useVisibleInterval so a
  // backgrounded tab doesn't hammer /api/chat.
  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    const fetchThreads = async () => {
      try {
        const d = await fetchJsonWithRetry<any>('/api/chat');
        if (!cancelled && Array.isArray(d)) {
          threadsLoadedRef.current = true;
          setThreads(d);
          setLoadError(false);
        }
      } catch {
        // Retries are exhausted at this point. Only shout about it if the
        // inbox has nothing to show — a background poll failing over a list
        // that's already on screen is invisible by design.
        if (!cancelled && !threadsLoadedRef.current) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchThreadsRef.current = fetchThreads;
    fetchThreads();
    return () => { cancelled = true; fetchThreadsRef.current = () => {}; };
  }, [status, refreshKey]);

  useVisibleInterval(
    () => fetchThreadsRef.current(),
    status === 'authenticated' ? 15000 : null,
  );

  // Spinner only on thread switch — a refresh after an offer action must not
  // blank the stream the user is looking at.
  useEffect(() => {
    setMsgLoading(!!activeThreadId);
    setMsgError(false);
    setNegotiation(null);
    setDetailRequest(null);
    setDetailUnlocked(null);
    detailLoadedRef.current = false;
  }, [activeThreadId]);

  // Stable ref to the latest active-thread poll — same visibility-gated
  // pattern as the thread-list poll above.
  const fetchMsgsRef = useRef<() => void>(() => {});

  // Fetch messages + negotiation state for the active thread.
  useEffect(() => {
    if (!activeThreadId) { setMessages([]); fetchMsgsRef.current = () => {}; return; }
    let cancelled = false;
    // Scoped to this effect run (i.e. to this thread) so switching threads
    // never inherits a stuck flag from the previous conversation's poll.
    let inFlight = false;

    // GET ?threadId returns { messages, textUnlocked, negotiation, request }; it
    // used to return a bare array. Accept both so a stale deployment still
    // renders.
    //
    // A failed detail fetch used to be indistinguishable from an empty thread:
    // `list` came back null, messages stayed [] and the user read "Start the
    // conversation" on a thread that actually has history. Surface it — but
    // only once the retries are spent and only when there's nothing on screen,
    // otherwise a cold-start blip mid-conversation flashes a scary banner over
    // a perfectly readable thread.
    const fetchMsgs = async () => {
      // The poll runs every 3s and a retried attempt can outlive that; skip
      // rather than stack overlapping requests on a struggling backend.
      if (inFlight) return;
      inFlight = true;
      try {
        const d = await fetchJsonWithRetry<any>(`/api/chat?threadId=${activeThreadId}`);
        if (cancelled) return;
        const list = Array.isArray(d) ? d : Array.isArray(d?.messages) ? d.messages : null;
        if (!list) {
          if (!detailLoadedRef.current) setMsgError(true);
          return;
        }
        detailLoadedRef.current = true;
        setMsgError(false);
        setMessages(list);
        if (!Array.isArray(d) && d && typeof d === 'object') {
          setNegotiation((d.negotiation as Negotiation) ?? null);
          setDetailRequest(asThreadRequest(d.request));
          setDetailUnlocked(d.textUnlocked !== false);
        }
      } catch (err) {
        if (cancelled) return;
        // 403/404 is the server's final answer: this thread genuinely isn't
        // available to this account. Anything else (5xx, network) only surfaces
        // when we have no messages to show.
        if (isDefinitiveError(err) || !detailLoadedRef.current) setMsgError(true);
      } finally {
        inFlight = false;
      }
    };

    fetchMsgsRef.current = fetchMsgs;
    fetchMsgs().finally(() => { if (!cancelled) setMsgLoading(false); });
    return () => { cancelled = true; fetchMsgsRef.current = () => {}; };
  }, [activeThreadId, refreshKey]);

  // Visibility-gated 3s poll — pauses on backgrounded tabs, and fires ONE
  // immediate refresh when the user comes back to the tab.
  useVisibleInterval(
    () => fetchMsgsRef.current(),
    activeThreadId ? 3000 : null,
  );

  const activeThread = threads.find(th => th.id === activeThreadId);
  // Threads now appear from the first quote onward, so a deep link that isn't
  // in the list is genuinely unreachable for this account (deleted, not
  // theirs, or a stale notification href) — not "waiting on a deposit".
  //
  // "Genuinely" is load-bearing: a cold-start failure of the list fetch also
  // leaves `threads` empty, and that used to read as "We couldn't open that
  // conversation". Require an actually-successful list read before making that
  // claim.
  const threadLocked =
    !!activeThreadId && !activeThread && !loading && threadsLoadedRef.current && !loadError;

  // Detail response wins (freshest); the list row is the fallback while the
  // first message fetch is in flight. Default open so an older API shape
  // without the flag keeps today's behaviour.
  const textUnlocked = detailUnlocked ?? activeThread?.textUnlocked ?? true;

  // Same precedence for the pinned request: the detail response is freshest,
  // the list row covers the first paint (and an older API shape that omits it).
  const threadRequest =
    detailRequest ?? asThreadRequest(activeThread?.request) ?? null;

  if (status === 'loading' || loading) {
    return (
      <CustomerLayout flush>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-ink-dim" />
        </div>
      </CustomerLayout>
    );
  }

  const appendMessage = (msg: ChatMessage) => setMessages(prev => [...prev, msg]);

  // Mobile: full-screen chat overlay when a thread is open. Rendered as a
  // fragment (not an early return) so the desktop two-pane below still
  // renders — the old early return blanked the page on md+ viewports.
  const mobileChat = activeThreadId && activeThread ? (
    <ConversationPane
      className="flex flex-col h-[calc(100dvh-8.5rem)] md:hidden"
      thread={activeThread}
      messages={messages}
      msgLoading={msgLoading}
      msgError={msgError}
      userId={userId}
      negotiation={negotiation}
      request={threadRequest}
      viewerIsProvider={isProvider}
      textUnlocked={textUnlocked}
      onActed={refreshNow}
      t={t}
      onBack={() => router.push('/messages')}
      onSent={appendMessage}
    />
  ) : null;

  const emptyState = (
    <div className="bg-card rounded-card border border-dashed border-border-dim p-4 sm:p-8">
      <EmptyState
        icon={MessageCircle}
        size="lg"
        title={loadError ? t.messagesPage.loadErrorTitle : t.messagesPage.emptyTitle}
        description={
          loadError
            ? t.messagesPage.loadErrorDesc
            : isProvider
              ? t.messagesPage.emptyDescProvider
              : t.messagesPage.emptyDescCustomer
        }
      />
    </div>
  );

  const pageHeader = (
    <PageHeader title={t.messagesPage.title} description={t.messagesPage.subtitle} className="mb-6" />
  );

  return (
    <CustomerLayout flush>
      {mobileChat}

      {/* ── Mobile: inbox list (hidden while a chat is open) ── */}
      <div className={`md:hidden max-w-3xl mx-auto p-4 ${mobileChat ? 'hidden' : ''}`}>
        {pageHeader}

        {threadLocked && (
          <Alert variant="caution" icon={AlertCircle} className="mb-4">
            {t.messagesPage.lockedNotice}
          </Alert>
        )}

        {threads.length === 0 ? emptyState : (
          <ThreadList
            className="bg-card rounded-card border border-border-dim overflow-hidden divide-y divide-border-dim"
            threads={threads}
            activeThreadId={activeThreadId}
            userId={userId}
            t={t}
          />
        )}
      </div>

      {/* ── Desktop: two-pane inbox ── */}
      <div className="hidden md:block max-w-6xl mx-auto p-6 lg:p-8">
        {pageHeader}

        {threads.length === 0 ? emptyState : (
          <div className="flex h-[calc(100dvh-19rem)] min-h-[480px] bg-card rounded-card border border-border-dim overflow-hidden">
            {/* Left: thread list */}
            <ThreadList
              className="w-80 lg:w-96 shrink-0 border-r border-border-dim overflow-y-auto divide-y divide-border-dim"
              threads={threads}
              activeThreadId={activeThreadId}
              userId={userId}
              t={t}
            />

            {/* Right: conversation pane */}
            <div className="flex-1 min-w-0 flex flex-col bg-canvas">
              {activeThreadId && activeThread ? (
                <ConversationPane
                  className="flex-1 min-h-0 flex flex-col"
                  thread={activeThread}
                  messages={messages}
                  msgLoading={msgLoading}
                  msgError={msgError}
                  userId={userId}
                  negotiation={negotiation}
                  request={threadRequest}
                  viewerIsProvider={isProvider}
                  textUnlocked={textUnlocked}
                  onActed={refreshNow}
                  t={t}
                  onSent={appendMessage}
                />
              ) : threadLocked ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <EmptyState
                    icon={AlertCircle}
                    size="lg"
                    title={t.messagesPage.messagingLocked}
                    description={t.messagesPage.lockedNotice}
                    className="max-w-xs"
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <EmptyState
                    icon={MessageCircle}
                    size="lg"
                    title={t.messagesPage.selectConversation}
                    description={t.messagesPage.selectConversationDesc}
                    className="max-w-xs"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
