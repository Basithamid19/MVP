'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, MessageSquare, Clock, User,
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

export default function ProviderMessagesPage() {
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {threads.length} conversation{threads.length !== 1 ? 's' : ''}
        </p>
      </div>

      {threads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-7 h-7 text-gray-300" />
          </div>
          <p className="font-bold text-sm mb-1">No messages yet</p>
          <p className="text-xs text-gray-400">
            When customers message you about a job, their conversations will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {threads.map(thread => (
            <Link
              key={thread.id}
              href={`/chat/${thread.id}`}
              className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 hover:border-black transition-all group"
            >
              {/* Avatar */}
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                {thread.otherUser.image ? (
                  <img src={thread.otherUser.image} alt={thread.otherUser.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-gray-400" />
                )}
              </div>

              {/* Content */}
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

              {/* Time */}
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
    </div>
  );
}
