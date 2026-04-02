'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, MessageCircle, Send, User,
} from 'lucide-react';

function avatarUrl(name?: string | null, size = 40) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name ?? '?')}&size=${size}&background=e8f5e9&color=1B7A5A&bold=true`;
}

function timeAgo(date: string) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
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
  createdAt: string;
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeThreadId = searchParams.get('thread');

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const userId = (session?.user as any)?.id;

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  // Fetch thread list
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/chat')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setThreads(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
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

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim() || !activeThreadId || sending) return;
    setSending(true);
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: activeThreadId, content: newMsg.trim() }),
      });
      setNewMsg('');
      // Immediately fetch updated messages
      const r = await fetch(`/api/chat?threadId=${activeThreadId}`);
      const d = await r.json();
      if (Array.isArray(d)) setMessages(d);
    } finally {
      setSending(false);
    }
  };

  const activeThread = threads.find(t => t.id === activeThreadId);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-ink-dim" />
      </div>
    );
  }

  // Mobile: if thread is selected, show chat full-screen
  if (activeThreadId && activeThread) {
    return (
      <div className="flex flex-col h-[calc(100dvh-4rem)] md:hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-dim bg-white shrink-0">
          <button onClick={() => router.push('/messages')} className="text-ink-sub hover:text-ink transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img
            src={activeThread.otherParticipant.image || avatarUrl(activeThread.otherParticipant.name)}
            alt=""
            className="w-9 h-9 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-ink truncate">{activeThread.otherParticipant.name}</p>
            <p className="text-[10px] text-ink-dim">{activeThread.category}</p>
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
              <p className="text-sm text-ink-dim">No messages yet. Say hello!</p>
            </div>
          ) : (
            messages.map(m => {
              const isMine = m.senderId === userId;
              return (
                <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMine
                      ? 'bg-brand text-white rounded-br-md'
                      : 'bg-white border border-border-dim text-ink rounded-bl-md'
                  }`}>
                    <p>{m.content}</p>
                    <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-ink-dim'}`}>
                      {new Date(m.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        <div className="px-3 py-2.5 border-t border-border-dim bg-white shrink-0 mb-safe">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Type a message..."
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
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 pb-28 md:pb-8">
      <h1 className="text-xl sm:text-3xl font-semibold tracking-tight text-ink mb-1">Messages</h1>
      <p className="text-sm text-ink-sub mb-6">Your conversations with pros and customers.</p>

      {threads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-border-dim p-8 sm:p-12 text-center">
          <div className="w-14 h-14 bg-surface-alt rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-6 h-6 text-ink-dim" />
          </div>
          <p className="font-semibold text-base text-ink mb-1">No conversations yet</p>
          <p className="text-sm text-ink-sub max-w-xs mx-auto">
            Conversations are created automatically when a pro sends you a quote or you message a pro.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border-dim overflow-hidden divide-y divide-border-dim">
          {threads.map(t => (
            <Link
              key={t.id}
              href={`/messages?thread=${t.id}`}
              className={`flex items-center gap-3 px-4 py-3.5 hover:bg-surface-alt transition-colors ${
                t.id === activeThreadId ? 'bg-brand-muted' : ''
              }`}
            >
              <img
                src={t.otherParticipant.image || avatarUrl(t.otherParticipant.name)}
                alt=""
                className="w-11 h-11 rounded-full object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm text-ink truncate">{t.otherParticipant.name}</p>
                  {t.lastMessage && (
                    <span className="text-[10px] text-ink-dim shrink-0">{timeAgo(t.lastMessage.createdAt)}</span>
                  )}
                </div>
                <p className="text-xs text-ink-dim mt-0.5 truncate">
                  {t.lastMessage
                    ? `${t.lastMessage.senderId === userId ? 'You: ' : ''}${t.lastMessage.content}`
                    : `${t.category} · No messages yet`
                  }
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Desktop: inline chat panel */}
      {activeThreadId && activeThread && (
        <div className="hidden md:block mt-6">
          <div className="bg-white rounded-2xl border border-border-dim overflow-hidden" style={{ height: '500px' }}>
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-border-dim">
              <img
                src={activeThread.otherParticipant.image || avatarUrl(activeThread.otherParticipant.name)}
                alt=""
                className="w-9 h-9 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-sm text-ink">{activeThread.otherParticipant.name}</p>
                <p className="text-[10px] text-ink-dim">{activeThread.category}</p>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="overflow-y-auto px-5 py-4 space-y-2 bg-canvas" style={{ height: 'calc(100% - 120px)' }}>
              {messages.map(m => {
                const isMine = m.senderId === userId;
                return (
                  <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMine
                        ? 'bg-brand text-white rounded-br-md'
                        : 'bg-white border border-border-dim text-ink rounded-bl-md'
                    }`}>
                      <p>{m.content}</p>
                      <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-ink-dim'}`}>
                        {new Date(m.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-border-dim bg-white">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Type a message..."
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
        </div>
      )}
    </div>
  );
}
