'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Send, Loader2, User, ArrowLeft, Phone, ImagePlus, X, CheckCircle2, Calendar, Star, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SystemEvent {
  id: string;
  type: 'quote_sent' | 'quote_accepted' | 'booking_confirmed' | 'job_started' | 'job_completed' | 'review_left';
  label: string;
  timestamp: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  isSystem?: boolean;
}

const EVENT_ICONS: Record<SystemEvent['type'], React.ElementType> = {
  quote_sent: Clock,
  quote_accepted: CheckCircle2,
  booking_confirmed: Calendar,
  job_started: Clock,
  job_completed: CheckCircle2,
  review_left: Star,
};

const EVENT_COLORS: Record<SystemEvent['type'], string> = {
  quote_sent:        'bg-blue-50 text-blue-600 border-blue-100',
  quote_accepted:    'bg-green-50 text-green-600 border-green-100',
  booking_confirmed: 'bg-black text-white border-black',
  job_started:       'bg-orange-50 text-orange-600 border-orange-100',
  job_completed:     'bg-green-50 text-green-700 border-green-100',
  review_left:       'bg-yellow-50 text-yellow-700 border-yellow-100',
};

// Build a mock system event timeline based on booking state
function buildTimeline(booking?: any): SystemEvent[] {
  if (!booking) return [];
  const events: SystemEvent[] = [];
  const base = booking.createdAt ?? new Date().toISOString();
  events.push({ id: 'e1', type: 'quote_sent', label: 'Pro sent a quote', timestamp: base });
  if (booking.status !== 'SCHEDULED' || booking.createdAt) {
    events.push({ id: 'e2', type: 'quote_accepted', label: 'Quote accepted', timestamp: base });
    events.push({ id: 'e3', type: 'booking_confirmed', label: 'Booking confirmed', timestamp: base });
  }
  if (booking.status === 'IN_PROGRESS' || booking.status === 'COMPLETED') {
    events.push({ id: 'e4', type: 'job_started', label: 'Job started', timestamp: booking.scheduledAt ?? base });
  }
  if (booking.status === 'COMPLETED') {
    events.push({ id: 'e5', type: 'job_completed', label: 'Job completed', timestamp: booking.updatedAt ?? base });
  }
  if (booking.review) {
    events.push({ id: 'e6', type: 'review_left', label: `Review left: ${booking.review.rating}/5`, timestamp: booking.review.createdAt ?? base });
  }
  return events;
}

export default function ChatPage({ threadId, booking }: { threadId: string; booking?: any }) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingImage, setSendingImage] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const providerName = booking?.provider?.user?.name ?? 'Pro';
  const providerPhone = booking?.provider?.phone ?? null;
  const timeline = buildTimeline(booking);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat?threadId=${threadId}`);
        const data = await res.json();
        if (Array.isArray(data)) setMessages(data);
      } catch (error) {
        console.error('Failed to fetch messages', error);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [threadId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, content: newMessage }),
      });
      if (res.ok) {
        setNewMessage('');
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
      }
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSendingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const uploadRes = await fetch('/api/uploads', { method: 'POST', body: fd });
      if (!uploadRes.ok) throw new Error('upload failed');
      const uploaded = await uploadRes.json();

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, content: '📷 Photo', imageUrl: uploaded.url }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, { ...msg, imageUrl: uploaded.url }]);
      }
    } catch (error) {
      console.error('Failed to send image', error);
    } finally {
      setSendingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCall = () => {
    if (providerPhone) {
      window.location.href = `tel:${providerPhone}`;
    } else {
      alert('Call masking active. The pro will receive your call securely through VilniusPro.');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden shrink-0">
          {booking?.provider?.user?.image
            ? <img src={booking.provider.user.image} alt={providerName} className="w-full h-full object-cover" />
            : <User className="w-5 h-5 text-gray-400" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold truncate">{providerName}</div>
          <div className="text-xs text-green-500 font-bold uppercase tracking-widest">Online</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {timeline.length > 0 && (
            <button
              onClick={() => setShowTimeline(!showTimeline)}
              className={`p-2 rounded-full transition-colors text-xs font-bold ${showTimeline ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              title="Event timeline"
            >
              <Clock className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleCall}
            className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-full transition-colors"
            title="Call pro"
          >
            <Phone className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* System event timeline panel */}
      {showTimeline && timeline.length > 0 && (
        <div className="bg-white border-b border-gray-100 px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Event Timeline</p>
            <button onClick={() => setShowTimeline(false)} className="text-gray-400 hover:text-black transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <div className="absolute left-3.5 top-2 bottom-2 w-px bg-gray-100" />
            <div className="space-y-3">
              {timeline.map((event, i) => {
                const Icon = EVENT_ICONS[event.type];
                const colorClass = EVENT_COLORS[event.type];
                return (
                  <div key={event.id} className="flex items-center gap-3 relative">
                    <div className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 z-10 ${colorClass}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{event.label}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(event.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <MessageBubbleIcon />
            <p className="text-sm font-medium mt-3">Start the conversation</p>
            <p className="text-xs mt-1">Ask questions before you confirm the booking.</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === (session?.user as any)?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-[20px] overflow-hidden shadow-sm ${
                isMe ? 'bg-black text-white rounded-tr-none' : 'bg-white text-black rounded-tl-none border border-gray-100'
              }`}>
                {msg.imageUrl && (
                  <img
                    src={msg.imageUrl}
                    alt="Shared photo"
                    className="w-full max-w-[240px] object-cover"
                  />
                )}
                {msg.content && msg.content !== '📷 Photo' && (
                  <div className="px-4 py-3 text-sm font-medium">
                    {msg.content}
                    <div className={`text-[10px] mt-1 opacity-50`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )}
                {msg.content === '📷 Photo' && !msg.imageUrl && (
                  <div className="px-4 py-3 text-sm font-medium">
                    📷 Photo
                    <div className="text-[10px] mt-1 opacity-50">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-2 items-end">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sendingImage}
            className="w-12 h-12 bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-black rounded-2xl flex items-center justify-center transition-all shrink-0 disabled:opacity-50"
            title="Share image"
          >
            {sendingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
          </button>
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all text-sm"
          />
          <button 
            type="submit" 
            disabled={loading || !newMessage.trim()}
            className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center hover:bg-gray-800 transition-all disabled:opacity-50 shrink-0"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}

function MessageBubbleIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="mx-auto opacity-20">
      <rect width="40" height="40" rx="20" fill="#000"/>
      <path d="M10 14C10 12.9 10.9 12 12 12H28C29.1 12 30 12.9 30 14V24C30 25.1 29.1 26 28 26H22L16 30V26H12C10.9 26 10 25.1 10 24V14Z" fill="white"/>
    </svg>
  );
}
