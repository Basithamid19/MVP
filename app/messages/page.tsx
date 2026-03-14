'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, MessageSquare, Clock, User, ArrowLeft,
} from 'lucide-react';

function timeAgo(date: string) {
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') {
      fetch('/api/chat/threads')
        .then(r => r.json())
        .then(d => { if (Array.isArray(d)) setThreads(d); })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">Messages</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <p className="text-sm text-gray-500 mb-5">
          {threads.length} conversation{threads.length !== 1 ? 's' : ''}
        </p>

        {threads.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-7 h-7 text-gray-300" />
            </div>
            <p className="font-bold text-sm mb-1">No messages yet</p>
            <p className="text-xs text-gray-400 mb-4">
              Start a conversation by contacting a professional.
            </p>
            <Link href="/browse" className="inline-flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-800 transition-all">
              Find a Pro
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map(thread => (
              <Link
                key={thread.id}
                href={`/chat/${thread.id}`}
                className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 hover:border-black transition-all"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                  {thread.otherUser.image ? (
                    <img src={thread.otherUser.image} alt={thread.otherUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-sm truncate">{thread.otherUser.name}</p>
                    {thread.category && (
                      <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">
                        {thread.category}
                      </span>
                    )}
                  </div>
                  {thread.lastMessage ? (
                    <p className="text-xs text-gray-500 truncate">
                      {thread.lastMessage.isMe ? 'You: ' : ''}
                      {thread.lastMessage.content}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No messages yet</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  {thread.lastMessage && (
                    <p className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(thread.lastMessage.createdAt)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
