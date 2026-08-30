'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, AlertCircle, MapPin, Clock, RefreshCcw,
  ChevronRight, Timer, DollarSign, Search, Inbox, Send,
} from 'lucide-react';
import { TIME_OF_DAY_LABELS } from '@/lib/time';
import { useTranslation } from '@/lib/i18n';
import { PageHeader } from '@/components/ui';

function ResponseTimer({ createdAt }: { createdAt: string }) {
  const t = useTranslation();
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const update = () => {
      const ms = Date.now() - new Date(createdAt).getTime();
      const mins = Math.floor(ms / 60000);
      const hrs = Math.floor(mins / 60);
      const days = Math.floor(hrs / 24);
      if (days > 0) setElapsed(`${t.messagesPage.agoPrefix}${days}${t.messagesPage.daysSuffix}`);
      else if (hrs > 0) setElapsed(`${t.messagesPage.agoPrefix}${hrs}${t.leadsPage.hoursShortSuffix} ${mins % 60}${t.messagesPage.minutesSuffix}`);
      else setElapsed(`${t.messagesPage.agoPrefix}${mins}${t.messagesPage.minutesSuffix}`);
    };
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, [createdAt, t]);

  return <span className="text-2xs sm:text-xs text-ink-dim">{elapsed}</span>;
}

export default function ProviderLeadsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslation();
  const [leads, setLeads] = useState<any[]>([]);
  const [hasCategories, setHasCategories] = useState(true);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'urgent' | 'new'>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  // Leads the provider dismissed with "Pass" — device-local only, so the lead
  // reappears on another device but stays hidden here.
  const [passed, setPassed] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('aladdin_passed_leads') ?? '[]');
      if (Array.isArray(stored)) setPassed(stored);
    } catch {}
  }, []);

  const passLead = (id: string) => {
    setPassed(prev => {
      const next = [...new Set([...prev, id])].slice(-200);
      try { localStorage.setItem('aladdin_passed_leads', JSON.stringify(next)); } catch {}
      return next;
    });
    setExpanded(null);
  };

  const load = useCallback(() => {
    Promise.allSettled([
      fetch('/api/provider/leads').then(r => r.json()),
      fetch('/api/provider/profile').then(r => r.json()),
    ]).then(([leadsRes, profileRes]) => {
      if (leadsRes.status === 'fulfilled' && Array.isArray(leadsRes.value)) {
        setLeads(leadsRes.value);
      }
      if (profileRes.status === 'fulfilled') {
        setHasCategories((profileRes.value?.categories?.length ?? 0) > 0);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') load();
  }, [status, router, load]);

  const visibleLeads = leads.filter(l => !passed.includes(l.id));
  const urgentCt = visibleLeads.filter(l => l.isUrgent).length;
  const newCt = visibleLeads.filter(l => !l.quotes?.length).length;

  const filtered = visibleLeads.filter(l => {
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
    <div className="max-w-4xl mx-auto">
      {/* Mobile-only section tabs */}
      <div className="md:hidden flex gap-1 p-1 bg-surface-alt rounded-card border border-border-dim mb-5">
        <div className="flex-1 py-2.5 rounded-input text-sm font-semibold text-center transition-all bg-card text-brand shadow-card">
          {t.providerNav.leads}
        </div>
        <Link href="/provider/jobs" className="flex-1 py-2.5 rounded-input text-sm font-medium text-center transition-all text-ink-sub hover:text-ink">
          {t.providerNav.jobs}
        </Link>
      </div>

      <PageHeader
        title={t.leadsPage.title}
        description={`${visibleLeads.length} ${visibleLeads.length !== 1 ? t.leadsPage.openRequestsPlural : t.leadsPage.openRequestSingular}${urgentCt > 0 ? ` · ${urgentCt} ${t.leadsPage.urgentCountSuffix}` : ''}`}
        className="mb-4 sm:mb-8"
        action={
          <button onClick={load} className="p-2 border border-border-dim rounded-input hover:bg-surface-alt transition-colors">
            <RefreshCcw className="w-4 h-4 sm:w-5 sm:h-5 text-ink-sub" />
          </button>
        }
      />

      {/* Category setup nudge — shown when provider has no categories */}
      {!hasCategories && (
        <Link
          href="/provider/settings"
          className="flex items-start gap-3 bg-caution-surface border border-caution-edge rounded-card px-4 py-3.5 mb-5 hover:bg-caution-surface/70 transition-colors"
        >
          <AlertCircle className="w-4 h-4 text-caution shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-caution">{t.leadsPage.setCategoriesTitle}</p>
            <p className="text-xs text-caution/80 mt-0.5">{t.leadsPage.setCategoriesDesc}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-caution shrink-0 mt-0.5" />
        </Link>
      )}

      {/* Search + filter — only show search when leads exist */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-5 sm:mb-8">
        {visibleLeads.length > 0 && (
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-dim" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.leadsPage.searchPlaceholder}
              className="w-full pl-10 pr-4 py-3 sm:py-3 bg-card border border-border-dim rounded-input sm:rounded-card focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none text-sm transition-all shadow-card"
            />
          </div>
        )}
        <div className="flex gap-1.5">
          {([
            { key: 'all' as const, label: t.leadsPage.filterAll, count: visibleLeads.length },
            { key: 'urgent' as const, label: t.leadsPage.filterUrgent, count: urgentCt },
            { key: 'new' as const, label: t.leadsPage.filterNew, count: newCt },
          ]).map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${
                filter === f.key
                  ? 'bg-brand text-white shadow-card'
                  : 'bg-card text-ink-sub border border-border-dim hover:text-ink'
              }`}>
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-card sm:rounded-panel border border-dashed border-border-dim p-6 sm:p-10 text-center">
          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-surface-alt rounded-full flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-5 h-5 sm:w-6 sm:h-6 text-ink-dim" />
          </div>
          <p className="font-semibold text-base mb-1 text-ink">{leads.length === 0 ? t.leadsPage.emptyNoLeadsTitle : t.leadsPage.emptyNoMatchesTitle}</p>
          <p className="text-sm text-ink-sub mb-4">
            {leads.length === 0
              ? t.leadsPage.emptyNoLeadsDesc
              : t.leadsPage.emptyNoMatchesDesc}
          </p>
          {leads.length === 0 && (
            <Link href="/provider/settings" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark transition-colors">
              {t.leadsPage.checkProfile} <ChevronRight className="w-4 h-4" />
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
              <div key={lead.id} className={`bg-card rounded-card border transition-all shadow-card hover:shadow-md ${
                lead.isUrgent ? 'border-caution/30' : isNew ? 'border-info/30' : 'border-border-dim hover:border-brand/30'
              }`}>
                <div
                  className="p-4 sm:p-5 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : lead.id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2.5 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
                        <span className="text-3xs font-bold uppercase tracking-widest bg-surface-alt text-ink-sub px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
                          {lead.category?.name}
                        </span>
                        {lead.targetProviderId && (
                          <span className="flex items-center gap-1 text-3xs font-bold uppercase tracking-widest text-brand-dark bg-brand-muted px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
                            <Send className="w-3 h-3" /> {t.leadsPage.badgeDirect}
                          </span>
                        )}
                        {lead.isUrgent && (
                          <span className="flex items-center gap-1 text-3xs font-bold uppercase tracking-widest text-caution bg-caution-surface px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
                            <AlertCircle className="w-3 h-3" /> {t.leadsPage.badgeUrgent}
                          </span>
                        )}
                        {isNew && !lead.isUrgent && (
                          <span className="text-3xs font-bold uppercase tracking-widest text-info bg-info-surface px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">{t.leadsPage.badgeNew}</span>
                        )}
                        {quoteCount > 0 && (
                          <span className="text-2xs sm:text-xs font-medium text-ink-sub ml-0.5 sm:ml-1">{quoteCount} {quoteCount > 1 ? t.requestsList.quotesPlural : t.requestsList.quoteSingular}</span>
                        )}
                      </div>
                      <p className="text-base sm:text-base font-semibold text-ink line-clamp-2">{lead.description}</p>
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
                        <span className="flex items-center gap-1 text-3xs font-bold text-caution uppercase tracking-widest">
                          <Timer className="w-3 h-3" /> {t.leadsPage.respondFast}
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
                    <div className="bg-surface-alt rounded-input sm:rounded-card p-4 sm:p-5 mb-4 sm:mb-5 text-sm text-ink-sub leading-relaxed">
                      {lead.description}
                    </div>
                    {Array.isArray(lead.photoUrls) && lead.photoUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4 sm:mb-5">
                        {lead.photoUrls.map((u: string) => (
                          <a key={u} href={u} target="_blank" rel="noreferrer" className="block w-16 h-16 rounded-input overflow-hidden border border-border-dim">
                            <img src={u} alt="Request photo" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 sm:gap-4 mb-4 sm:mb-5 text-sm">
                      <div className="bg-card border border-border-dim rounded-input p-3 sm:p-4">
                        <p className="text-ink-sub text-xs sm:text-sm mb-0.5 sm:mb-1">{t.wizard.dateLabel}</p>
                        <p className="font-semibold text-sm sm:text-base text-ink">{new Date(lead.dateWindow).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                        <p className="text-2xs sm:text-xs text-ink-dim mt-0.5">{TIME_OF_DAY_LABELS[lead.timeOfDay] ?? t.wizard.timeFlexible}</p>
                      </div>
                      <div className="bg-card border border-border-dim rounded-input p-3 sm:p-4">
                        <p className="text-ink-sub text-xs sm:text-sm mb-0.5 sm:mb-1">{t.wizard.reviewBudget}</p>
                        <p className="font-semibold text-sm sm:text-base text-ink">{lead.budget ? `€${lead.budget}` : t.leadsPage.notSpecified}</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                      <Link
                        href={`/provider/quote/${lead.id}`}
                        className="flex-1 bg-brand text-white py-3 sm:py-3.5 rounded-full text-sm font-medium text-center hover:bg-brand-dark transition-all shadow-card hover:shadow-md"
                      >
                        {t.leadsPage.sendQuote}
                      </Link>
                      <button
                        onClick={() => passLead(lead.id)}
                        className="px-6 py-3 sm:py-3.5 border border-border-dim rounded-full text-sm font-medium text-ink-sub hover:text-ink hover:bg-surface-alt transition-colors"
                      >
                        {t.leadsPage.pass}
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
