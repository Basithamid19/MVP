'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, MessageCircle, Send, User, Lock,
} from 'lucide-react';
import CustomerLayout from '@/components/CustomerLayout';
import { PageHeader } from '@/components/ui';
import { avatarUrl } from '@/lib/avatar';
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

interface Message {
  id: string;
  senderId: string;
  content: string;
  imageUrl?: string | null;
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

function MessagesContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslation();
  const searchParams = useSearchParams();
  const activeThreadId = searchParams.get('thread');

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const deskScrollRef = useRef<HTMLDivElement>(null);
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

  // Auto-scroll on new messages (mobile and desktop panes mount separately)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    deskScrollRef.current?.scrollTo({ top: deskScrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim() || !activeThreadId || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: activeThreadId, content: newMsg.trim() }),
      });
      if (!res.ok) {
        // Keep the draft so the user can retry; surface why it failed
        // (locked thread, network, auth) instead of silently dropping it.
        const d = await res.json().catch(() => ({} as any));
        alert(d.error ?? t.messagesPage.sendFailed);
        return;
      }
      setNewMsg('');
      // Immediately fetch updated messages
      const r = await fetch(`/api/chat?threadId=${activeThreadId}`);
      const d = await r.json();
      if (Array.isArray(d)) setMessages(d);
    } catch {
      alert(t.messagesPage.sendFailedNetwork);
    } finally {
      setSending(false);
    }
  };

  const activeThread = threads.find(t => t.id === activeThreadId);
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

  // Mobile: full-screen chat overlay when a thread is open. Rendered as a
  // fragment (not an early return) so the desktop two-pane below still
  // renders — the old early return blanked the page on md+ viewports.
  const mobileChat = activeThreadId && activeThread ? (
      <div className="flex flex-col h-[calc(100dvh-8.5rem)] md:hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-dim bg-card shrink-0">
          <button onClick={() => router.push('/messages')} className="text-ink-sub hover:text-ink transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img
            src={activeThread.otherParticipant.image || avatarUrl(activeThread.otherParticipant.name, 40)}
            alt=""
            className="w-9 h-9 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-ink truncate">{activeThread.otherParticipant.name}</p>
            <p className="text-3xs text-ink-dim">{activeThread.category}</p>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-canvas">
          {msgLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-ink-dim" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-ink-dim">{t.messagesPage.noMessagesYet}</p>
            </div>
          ) : (
            messages.map(m => {
              const isMine = m.senderId === userId;
              return (
                <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-3.5 py-2.5 rounded-card text-sm leading-relaxed ${
                    isMine
                      ? 'bg-brand text-white rounded-br-md'
                      : 'bg-card border border-border-dim text-ink rounded-bl-md'
                  }`}>
                    {m.imageUrl && (
                      <img src={m.imageUrl} alt="Shared photo" className="max-w-full rounded-input mb-1.5" />
                    )}
                    <p>{m.content}</p>
                    <p className={`text-3xs mt-1 ${isMine ? 'text-white/60' : 'text-ink-dim'}`}>
                      {new Date(m.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        <div className="px-3 py-2.5 border-t border-border-dim bg-card shrink-0 mb-safe">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={t.messagesPage.typeMessage}
              className="flex-1 px-4 py-2.5 bg-canvas border border-border-dim rounded-full text-sm outline-none focus:ring-2 focus:ring-brand"
            />
            <button
              onClick={handleSend}
              disabled={!newMsg.trim() || sending}
              className="w-10 h-10 bg-brand text-white rounded-full flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
  ) : null;

  const emptyState = loadError ? (
    <div className="bg-card rounded-card border border-dashed border-border-dim p-8 sm:p-12 text-center">
      <div className="w-14 h-14 bg-caution-surface rounded-full flex items-center justify-center mx-auto mb-4">
        <MessageCircle className="w-6 h-6 text-caution" />
      </div>
      <p className="font-semibold text-base text-ink mb-1">{t.messagesPage.loadErrorTitle}</p>
      <p className="text-sm text-ink-sub max-w-xs mx-auto">
        {t.messagesPage.loadErrorDesc}
      </p>
    </div>
  ) : (
    <div className="bg-card rounded-card border border-dashed border-border-dim p-8 sm:p-12 text-center">
      <div className="w-14 h-14 bg-surface-alt rounded-full flex items-center justify-center mx-auto mb-4">
        <MessageCircle className="w-6 h-6 text-ink-dim" />
      </div>
      <p className="font-semibold text-base text-ink mb-1">{t.messagesPage.emptyTitle}</p>
      <p className="text-sm text-ink-sub max-w-xs mx-auto">
        {isProvider
          ? t.messagesPage.emptyDescProvider
          : t.messagesPage.emptyDescCustomer}
      </p>
    </div>
  );

  return (
    <CustomerLayout flush>
      {mobileChat}

      {/* ── Mobile: inbox list (hidden while a chat is open) ── */}
      <div className={`md:hidden max-w-3xl mx-auto p-4 ${mobileChat ? 'hidden' : ''}`}>
      <PageHeader title={t.messagesPage.title} description={t.messagesPage.subtitle} className="mb-6" />

      {threadLocked && (
        <div className="flex items-start gap-3 px-4 py-3 mb-4 bg-caution-surface border border-caution-edge rounded-card">
          <Lock className="w-4 h-4 text-caution shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-caution leading-relaxed">
            {t.messagesPage.lockedNotice}
          </p>
        </div>
      )}

      {threads.length === 0 ? (
        emptyState
      ) : (
        <div className="bg-card rounded-card border border-border-dim overflow-hidden divide-y divide-border-dim">
          {threads.map(th => (
            <Link
              key={th.id}
              href={`/messages?thread=${th.id}`}
              className={`flex items-center gap-3 px-4 py-3.5 hover:bg-surface-alt transition-colors ${
                th.id === activeThreadId ? 'bg-brand-muted' : ''
              }`}
            >
              <img
                src={th.otherParticipant.image || avatarUrl(th.otherParticipant.name, 44)}
                alt=""
                className="w-11 h-11 rounded-full object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm text-ink truncate">{th.otherParticipant.name}</p>
                  {th.lastMessage && (
                    <span className="text-3xs text-ink-dim shrink-0">{timeAgo(th.lastMessage.createdAt, t.messagesPage)}</span>
                  )}
                </div>
                <p className="text-xs text-ink-dim mt-0.5 truncate">
                  {th.lastMessage
                    ? `${th.lastMessage.senderId === userId ? t.messagesPage.youPrefix : ''}${th.lastMessage.content}`
                    : `${th.category} · ${t.messagesPage.noMessagesShort}`
                  }
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      </div>

      {/* ── Desktop: two-pane inbox ── */}
      <div className="hidden md:block max-w-6xl mx-auto p-6 lg:p-8">
        <PageHeader title={t.messagesPage.title} description={t.messagesPage.subtitle} className="mb-6" />

        {threads.length === 0 ? (
          emptyState
        ) : (
          <div className="flex h-[calc(100dvh-19rem)] min-h-[480px] bg-card rounded-card border border-border-dim overflow-hidden">
            {/* Left: thread list */}
            <div className="w-80 lg:w-96 shrink-0 border-r border-border-dim overflow-y-auto divide-y divide-border-dim">
              {threads.map(th => (
                <Link
                  key={th.id}
                  href={`/messages?thread=${th.id}`}
                  className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${
                    th.id === activeThreadId ? 'bg-brand-muted' : 'hover:bg-surface-alt'
                  }`}
                >
                  <img
                    src={th.otherParticipant.image || avatarUrl(th.otherParticipant.name, 44)}
                    alt=""
                    className="w-11 h-11 rounded-full object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm text-ink truncate">{th.otherParticipant.name}</p>
                      {th.lastMessage && (
                        <span className="text-3xs text-ink-dim shrink-0">{timeAgo(th.lastMessage.createdAt, t.messagesPage)}</span>
                      )}
                    </div>
                    <p className="text-xs text-ink-dim mt-0.5 truncate">
                      {th.lastMessage
                        ? `${th.lastMessage.senderId === userId ? t.messagesPage.youPrefix : ''}${th.lastMessage.content}`
                        : `${th.category} · ${t.messagesPage.noMessagesShort}`
                      }
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Right: conversation pane */}
            <div className="flex-1 min-w-0 flex flex-col bg-canvas">
              {activeThreadId && activeThread ? (
                <>
                  {/* Header */}
                  <div className="flex items-center gap-3 px-5 py-3 border-b border-border-dim bg-card shrink-0">
                    <img
                      src={activeThread.otherParticipant.image || avatarUrl(activeThread.otherParticipant.name, 40)}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-sm text-ink">{activeThread.otherParticipant.name}</p>
                      <p className="text-3xs text-ink-dim">{activeThread.category}</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div ref={deskScrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
                    {msgLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-ink-dim" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-sm text-ink-dim">{t.messagesPage.noMessagesYet}</p>
                      </div>
                    ) : (
                      messages.map(m => {
                        const isMine = m.senderId === userId;
                        return (
                          <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] px-3.5 py-2.5 rounded-card text-sm leading-relaxed ${
                              isMine
                                ? 'bg-brand text-white rounded-br-md'
                                : 'bg-card border border-border-dim text-ink rounded-bl-md'
                            }`}>
                              {m.imageUrl && (
                                <img src={m.imageUrl} alt="Shared photo" className="max-w-full rounded-input mb-1.5" />
                              )}
                              <p>{m.content}</p>
                              <p className={`text-3xs mt-1 ${isMine ? 'text-white/60' : 'text-ink-dim'}`}>
                                {new Date(m.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Input */}
                  <div className="px-4 py-3 border-t border-border-dim bg-card shrink-0">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newMsg}
                        onChange={e => setNewMsg(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder={t.messagesPage.typeMessage}
                        className="flex-1 px-4 py-2.5 bg-canvas border border-border-dim rounded-full text-sm outline-none focus:ring-2 focus:ring-brand"
                      />
                      <button
                        onClick={handleSend}
                        disabled={!newMsg.trim() || sending}
                        className="w-10 h-10 bg-brand text-white rounded-full flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : threadLocked ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-14 h-14 bg-caution-surface rounded-full flex items-center justify-center mb-4">
                    <Lock className="w-6 h-6 text-caution" />
                  </div>
                  <p className="font-semibold text-base text-ink mb-1">{t.messagesPage.messagingLocked}</p>
                  <p className="text-sm text-ink-sub max-w-xs">
                    {t.messagesPage.lockedNotice}
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-14 h-14 bg-surface-alt rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="w-6 h-6 text-ink-dim" />
                  </div>
                  <p className="font-semibold text-base text-ink mb-1">{t.messagesPage.selectConversation}</p>
                  <p className="text-sm text-ink-sub max-w-xs">
                    {t.messagesPage.selectConversationDesc}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
