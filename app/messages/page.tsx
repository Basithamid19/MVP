'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, MessageCircle, Lock } from 'lucide-react';
import CustomerLayout from '@/components/CustomerLayout';
import { Avatar, EmptyState, PageHeader } from '@/components/ui';
import { ChatComposer, MessageThread, type ChatMessage } from '@/components/shared/chat-view';
import { useTranslation } from '@/lib/i18n';
import type { Dictionary } from '@/lib/i18n/types';

function timeAgo(date: string, s: Dictionary['messagesPage']) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return s.justNow;
  if (mins < 60) return `${s.agoPrefix}${mins}${s.minutesSuffix}`;
  if (mins < 1440) return `${s.agoPrefix}${Math.floor(mins / 60)}${s.hoursSuffix}`;
  return `${s.agoPrefix}${Math.floor(mins / 1440)}${s.daysSuffix}`;
}

interface Thread {
  id: string;
  otherParticipant: { id: string; name: string | null; image: string | null; role: string };
  lastMessage: { content: string; senderId: string; createdAt: string } | null;
  category: string;
  createdAt: string;
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
 *
 * Note: the thread API (app/api/chat/route.ts) returns no read/unread state,
 * so there is no unread affordance to render here yet. Add `unreadCount` to
 * the GET payload first, then bold the row + show a brand dot.
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
      {threads.map(th => (
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
            {/* Name + relative time on one baseline */}
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-base font-bold text-ink truncate">{th.otherParticipant.name}</p>
              {th.lastMessage && (
                <span className="text-sm text-ink-dim shrink-0">
                  {timeAgo(th.lastMessage.createdAt, t.messagesPage)}
                </span>
              )}
            </div>

            {/* Context line — what this conversation is about */}
            <p className="text-sm text-ink-sub font-medium mt-0.5 truncate">{th.category}</p>

            {/* Two-line message preview */}
            {th.lastMessage ? (
              <p className="text-sm text-ink-sub mt-1.5 leading-relaxed line-clamp-2">
                {th.lastMessage.senderId === userId ? t.messagesPage.youPrefix : ''}
                {th.lastMessage.content}
              </p>
            ) : (
              <p className="text-sm text-ink-dim mt-1.5">{t.messagesPage.noMessagesShort}</p>
            )}
          </div>
        </Link>
      ))}
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
  userId,
  t,
  onBack,
  onSent,
  className,
}: {
  thread: Thread;
  messages: ChatMessage[];
  msgLoading: boolean;
  userId?: string;
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

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 bg-canvas">
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
          />
        )}
      </div>

      {/* Composer */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-t border-border-dim bg-card shrink-0">
        <ChatComposer threadId={thread.id} onSent={onSent} />
      </div>
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
  const userId = (session?.user as any)?.id;
  const isProvider = (session?.user as any)?.role === 'PROVIDER';

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  // Fetch thread list. Polled, not one-shot: a single failed fetch right
  // after login (cold serverless start, transient DB error) used to leave the
  // inbox permanently on "No conversations yet" until a manual refresh.
  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    const fetchThreads = async () => {
      try {
        const r = await fetch('/api/chat');
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = await r.json();
        if (!cancelled && Array.isArray(d)) {
          setThreads(d);
          setLoadError(false);
        }
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchThreads();
    const interval = setInterval(fetchThreads, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [status]);

  // Fetch messages for active thread
  useEffect(() => {
    if (!activeThreadId) { setMessages([]); return; }
    setMsgLoading(true);
    const fetchMsgs = () =>
      fetch(`/api/chat?threadId=${activeThreadId}`)
        .then(r => r.json())
        .then(d => { if (Array.isArray(d)) setMessages(d); })
        .catch(() => {});

    fetchMsgs().finally(() => setMsgLoading(false));
    const interval = setInterval(fetchMsgs, 3000);
    return () => clearInterval(interval);
  }, [activeThreadId]);

  const activeThread = threads.find(th => th.id === activeThreadId);
  // Deep link (e.g. an old notification) to a conversation that isn't
  // unlocked yet — the server filters it out of the list and 403s reads, so
  // without this the pane rendered silently blank.
  const threadLocked = !!activeThreadId && !activeThread && !loading;

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
      userId={userId}
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
          <div className="flex items-start gap-3 px-4 py-3 mb-4 bg-caution-surface border border-caution-edge rounded-card">
            <Lock className="w-4 h-4 text-caution shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-caution leading-relaxed">
              {t.messagesPage.lockedNotice}
            </p>
          </div>
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
                  userId={userId}
                  t={t}
                  onSent={appendMessage}
                />
              ) : threadLocked ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <EmptyState
                    icon={Lock}
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
