'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, AlertCircle, MapPin, Clock, RefreshCcw,
  ChevronRight, Timer, DollarSign, Search, Filter,
} from 'lucide-react';

function ResponseTimer({ createdAt }: { createdAt: string }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const update = () => {
      const ms = Date.now() - new Date(createdAt).getTime();
      const mins = Math.floor(ms / 60000);
      const hrs = Math.floor(mins / 60);
      const days = Math.floor(hrs / 24);
      if (days > 0) setElapsed(`${days}d ago`);
      else if (hrs > 0) setElapsed(`${hrs}h ${mins % 60}m ago`);
      else setElapsed(`${mins}m ago`);
    };
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, [createdAt]);

  return <span className="text-xs text-gray-400">{elapsed}</span>;
}

export default function ProviderLeadsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'urgent' | 'new'>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch('/api/provider/leads')
      .then(r => r.json())
      .then(d => { setLeads(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') load();
  }, [status, router, load]);

  const filtered = leads.filter(l => {
    if (filter === 'urgent' && !l.isUrgent) return false;
    if (filter === 'new' && l.quotes?.length > 0) return false;
    if (search && !l.description?.toLowerCase().includes(search.toLowerCase()) &&
        !l.category?.name?.toLowerCase().includes(search.toLowerCase()) &&
        !l.address?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (status === 'loading' || loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lead Inbox</h1>
          <p className="text-sm text-gray-500 mt-0.5">{leads.length} open request{leads.length !== 1 ? 's' : ''} in your area</p>
        </div>
        <button onClick={load} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <RefreshCcw className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search leads…"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none text-sm"
          />
        </div>
        <div className="flex gap-1 p-1 bg-white rounded-xl border border-gray-100">
          {(['all', 'urgent', 'new'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${filter === f ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 text-center">
          <Filter className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="font-bold mb-1">{leads.length === 0 ? 'No leads yet' : 'No matches'}</p>
          <p className="text-sm text-gray-400">
            {leads.length === 0
              ? 'New service requests in your categories will appear here automatically.'
              : 'Try changing your filter or search term.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(lead => {
            const isExpanded = expanded === lead.id;
            const quoteCount = lead.quotes?.length ?? 0;
            const ageMs = Date.now() - new Date(lead.createdAt).getTime();
            const isNew = ageMs < 3600000; // < 1 hour

            return (
              <div key={lead.id} className={`bg-white rounded-2xl border transition-all shadow-sm ${
                lead.isUrgent ? 'border-orange-200' : isNew ? 'border-blue-100' : 'border-gray-100'
              }`}>
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : lead.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {lead.category?.name}
                        </span>
                        {lead.isUrgent && (
                          <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3" /> Urgent
                          </span>
                        )}
                        {isNew && !lead.isUrgent && (
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">New</span>
                        )}
                        {quoteCount > 0 && (
                          <span className="text-xs text-gray-400">{quoteCount} quote{quoteCount > 1 ? 's' : ''} sent</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-800 line-clamp-2">{lead.description}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin className="w-3 h-3" /> {lead.address}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {new Date(lead.dateWindow).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                        {lead.budget && (
                          <span className="flex items-center gap-1 text-xs text-green-600 font-bold">
                            <DollarSign className="w-3 h-3" /> Budget: €{lead.budget}
                          </span>
                        )}
                        <ResponseTimer createdAt={lead.createdAt} />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {lead.isUrgent && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600">
                          <Timer className="w-3 h-3" /> Respond fast
                        </span>
                      )}
                      <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-50 pt-4">
                    <div className="bg-gray-50 rounded-2xl p-4 mb-4 text-sm text-gray-700 leading-relaxed">
                      {lead.description}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                      <div className="bg-white border border-gray-100 rounded-xl p-3">
                        <p className="text-gray-400 mb-0.5">Preferred date</p>
                        <p className="font-bold">{new Date(lead.dateWindow).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                      </div>
                      <div className="bg-white border border-gray-100 rounded-xl p-3">
                        <p className="text-gray-400 mb-0.5">Budget</p>
                        <p className="font-bold">{lead.budget ? `€${lead.budget}` : 'Not specified'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/provider/quote/${lead.id}`}
                        className="flex-1 bg-black text-white py-3 rounded-xl text-sm font-bold text-center hover:bg-gray-800 transition-all"
                      >
                        Send Quote
                      </Link>
                      <button className="px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:border-gray-400 transition-colors">
                        Pass
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
