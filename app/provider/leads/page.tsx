'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, AlertCircle, MapPin, Clock, RefreshCcw,
  ChevronRight, Timer, DollarSign, Search, Inbox,
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

  return <span className="text-[11px] sm:text-xs text-ink-dim">{elapsed}</span>;
}

export default function ProviderLeadsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  const [hasCategories, setHasCategories] = useState(true);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'urgent' | 'new'>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([
      fetch('/api/provider/leads').then(r => r.json()),
      fetch('/api/provider/profile').then(r => r.json()),
    ])
      .then(([leadsData, profile]) => {
        setLeads(Array.isArray(leadsData) ? leadsData : []);
        setHasCategories((profile?.categories?.length ?? 0) > 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') load();
  }, [status, router, load]);

  const urgentCt = leads.filter(l => l.isUrgent).length;
  const newCt = leads.filter(l => !l.quotes?.length).length;

  const filtered = leads.filter(l => {
    if (filter === 'urgent' && !l.isUrgent) return false;
    if (filter === 'new' && l.quotes?.length > 0) return false;
    if (search && !l.description?.toLowerCase().includes(search.toLowerCase()) &&
        !l.category?.name?.toLowerCase().includes(search.toLowerCase()) &&
        !l.address?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (status === 'loading' || loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-ink-dim" /></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Mobile-only section tabs */}
      <div className="md:hidden flex gap-1 p-1 bg-canvas rounded-2xl border border-border-dim mb-5">
        <div className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center transition-all bg-white text-brand shadow-card">
          Leads
        </div>
        <Link href="/provider/jobs" className="flex-1 py-2.5 rounded-xl text-sm font-medium text-center transition-all text-ink-sub hover:text-ink">
          Jobs
        </Link>
      </div>

      <div className="flex items-center justify-between mb-4 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-3xl font-semibold tracking-tight text-ink">Lead Inbox</h1>
          <p className="text-xs sm:text-sm text-ink-sub mt-0.5 sm:mt-1">
            {leads.length} open request{leads.length !== 1 ? 's' : ''}{urgentCt > 0 ? ` · ${urgentCt} urgent` : ''}
          </p>
        </div>
        <button onClick={load} className="p-2 border border-border-dim rounded-xl hover:bg-surface-alt transition-colors">
          <RefreshCcw className="w-4 h-4 sm:w-5 sm:h-5 text-ink-sub" />
        </button>
      </div>

      {/* Category setup nudge — shown when provider has no categories */}
      {!hasCategories && (
        <Link
          href="/provider/settings"
          className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5 mb-5 hover:bg-amber-100 transition-colors"
        >
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900">Set your service categories</p>
            <p className="text-xs text-amber-700 mt-0.5">You're seeing all open leads. Add your categories in settings so we can match the right jobs to you.</p>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        </Link>
      )}

      {/* Search + filter — only show search when leads exist */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-5 sm:mb-8">
        {leads.length > 0 && (
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-dim" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search leads…"
              className="w-full pl-10 pr-4 py-3 sm:py-3 bg-white border border-border-dim rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none text-sm transition-all shadow-sm"
            />
          </div>
        )}
        <div className="flex gap-1.5">
          {([
            { key: 'all' as const, label: 'All', count: leads.length },
            { key: 'urgent' as const, label: 'Urgent', count: urgentCt },
            { key: 'new' as const, label: 'New', count: newCt },
          ]).map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${
                filter === f.key
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-white text-ink-sub border border-border-dim hover:text-ink'
              }`}>
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-dashed border-border-dim p-6 sm:p-10 text-center">
          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-surface-alt rounded-full flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-5 h-5 sm:w-6 sm:h-6 text-ink-dim" />
          </div>
          <p className="font-semibold text-base mb-1 text-ink">{leads.length === 0 ? 'No leads yet' : 'No matches'}</p>
          <p className="text-sm text-ink-sub mb-4">
            {leads.length === 0
              ? 'Leads are matched based on your service categories and area. Make sure your profile is complete to start receiving leads.'
              : 'Try changing your filter or search term.'}
          </p>
          {leads.length === 0 && (
            <Link href="/provider/settings" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark transition-colors">
              Check your profile <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2.5 sm:space-y-3">
          {filtered.map(lead => {
            const isExpanded = expanded === lead.id;
            const quoteCount = lead.quotes?.length ?? 0;
            const ageMs = Date.now() - new Date(lead.createdAt).getTime();
            const isNew = ageMs < 3600000; // < 1 hour

            return (
              <div key={lead.id} className={`bg-white rounded-2xl border transition-all shadow-sm hover:shadow-md ${
                lead.isUrgent ? 'border-caution/30' : isNew ? 'border-info/30' : 'border-border-dim hover:border-brand/30'
              }`}>
                <div
                  className="p-4 sm:p-5 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : lead.id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2.5 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-surface-alt text-ink-sub px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
                          {lead.category?.name}
                        </span>
                        {lead.isUrgent && (
                          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-caution bg-caution-surface px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
                            <AlertCircle className="w-3 h-3" /> Urgent
                          </span>
                        )}
                        {isNew && !lead.isUrgent && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-info bg-info-surface px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">New</span>
                        )}
                        {quoteCount > 0 && (
                          <span className="text-[11px] sm:text-xs font-medium text-ink-sub ml-0.5 sm:ml-1">{quoteCount} quote{quoteCount > 1 ? 's' : ''}</span>
                        )}
                      </div>
                      <p className="text-[15px] sm:text-base font-semibold text-ink line-clamp-2">{lead.description}</p>
                      <div className="flex items-center gap-3 sm:gap-4 mt-2 sm:mt-3 flex-wrap">
                        <span className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-ink-sub">
                          <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {lead.address}
                        </span>
                        <span className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-ink-sub">
                          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          {new Date(lead.dateWindow).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                        {lead.budget && (
                          <span className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-trust font-semibold">
                            <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> €{lead.budget}
                          </span>
                        )}
                        <ResponseTimer createdAt={lead.createdAt} />
                      </div>
                    </div>
                    <div className="hidden sm:flex sm:flex-col items-end justify-start gap-2 shrink-0">
                      {lead.isUrgent && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-caution uppercase tracking-widest">
                          <Timer className="w-3 h-3" /> Respond fast
                        </span>
                      )}
                      <ChevronRight className={`w-5 h-5 text-ink-dim transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                    {/* Mobile chevron — inline, right-aligned */}
                    <div className="flex sm:hidden items-center justify-end -mt-1">
                      <ChevronRight className={`w-4 h-4 text-ink-dim transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-border-dim pt-4 sm:pt-5">
                    <div className="bg-surface-alt rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-5 text-sm text-ink-sub leading-relaxed">
                      {lead.description}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 sm:gap-4 mb-4 sm:mb-5 text-sm">
                      <div className="bg-white border border-border-dim rounded-xl p-3 sm:p-4">
                        <p className="text-ink-sub text-xs sm:text-sm mb-0.5 sm:mb-1">Preferred date</p>
                        <p className="font-semibold text-sm sm:text-base text-ink">{new Date(lead.dateWindow).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                      </div>
                      <div className="bg-white border border-border-dim rounded-xl p-3 sm:p-4">
                        <p className="text-ink-sub text-xs sm:text-sm mb-0.5 sm:mb-1">Budget</p>
                        <p className="font-semibold text-sm sm:text-base text-ink">{lead.budget ? `€${lead.budget}` : 'Not specified'}</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                      <Link
                        href={`/provider/quote/${lead.id}`}
                        className="flex-1 bg-brand text-white py-3 sm:py-3.5 rounded-full text-sm font-medium text-center hover:bg-brand-dark transition-all shadow-sm hover:shadow-md"
                      >
                        Send Quote
                      </Link>
                      <button className="px-6 py-3 sm:py-3.5 border border-border-dim rounded-full text-sm font-medium text-ink-sub hover:text-ink hover:bg-surface-alt transition-colors">
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
