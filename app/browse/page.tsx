'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Star, ShieldCheck, Search as SearchIcon,
  Loader2, Clock, ChevronRight, SlidersHorizontal, CheckCircle2,
} from 'lucide-react';
import MobileNav from '@/components/MobileNav';
import { useSession } from 'next-auth/react';
import { avatarUrl } from '@/lib/avatar';

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Electrician', value: 'electrician' },
  { label: 'Plumber', value: 'plumber' },
  { label: 'Cleaning', value: 'cleaning' },
  { label: 'Handyman', value: 'handyman' },
  { label: 'Moving Help', value: 'moving-help' },
  { label: 'Furniture Assembly', value: 'furniture-assembly' },
];

const SORT_OPTIONS = [
  { id: 'top_rated',     label: 'Top rated' },
  { id: 'most_reviewed', label: 'Most reviewed' },
  { id: 'fastest',       label: 'Fastest response' },
];

function parseResponseMinutes(rt: string | null): number {
  if (!rt) return 9999;
  const m = rt.toLowerCase().match(/(\d+)\s*(min|hour|day)/);
  if (!m) return 9999;
  const n = parseInt(m[1]);
  if (m[2].startsWith('min'))  return n;
  if (m[2].startsWith('hour')) return n * 60;
  return n * 1440;
}

function BrowseContent() {
  const searchParams   = useSearchParams();
  const { data: session } = useSession();
  const initialCategory = searchParams.get('category') || '';

  const [providers,     setProviders]     = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [category,      setCategory]      = useState(initialCategory);
  const [search,        setSearch]        = useState('');
  const [sortBy,        setSortBy]        = useState('top_rated');
  const [showSortSheet, setShowSortSheet] = useState(false);

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        const res  = await fetch(`/api/providers?${params.toString()}`);
        const data = await res.json();
        setProviders(Array.isArray(data) ? data : []);
      } catch {
        setProviders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProviders();
  }, [category]);

  const filtered = search.trim()
    ? providers.filter(p =>
        p.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.categories?.[0]?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : providers;

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'most_reviewed': return (b.completedJobs ?? 0) - (a.completedJobs ?? 0);
      case 'fastest':       return parseResponseMinutes(a.responseTime) - parseResponseMinutes(b.responseTime);
      default:              return (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0);
    }
  });

  return (
    <div className="min-h-screen bg-canvas overflow-x-hidden w-full flex flex-col pb-28">

      {/* ── Sticky header ── */}
      <header className="bg-white/95 backdrop-blur-md border-b border-border-dim sticky top-0 z-20 w-full shadow-sm">
        <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">

          {/* Search field */}
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-dim pointer-events-none" />
            <input
              type="text"
              placeholder="Search professionals..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-3 bg-surface-alt border border-border-dim rounded-2xl text-base sm:text-sm text-ink placeholder:text-ink-dim focus:outline-none focus:ring-2 focus:ring-brand/30 focus:bg-white focus:border-brand/20 transition-all"
            />
          </div>

          {/* Sort button */}
          <button
            onClick={() => setShowSortSheet(true)}
            className={`flex items-center gap-1.5 px-3.5 h-10 rounded-2xl border text-xs font-bold transition-all shrink-0 ${
              sortBy !== 'top_rated'
                ? 'bg-brand-muted text-brand border-brand/30'
                : 'bg-surface-alt border-border-dim text-ink-sub hover:border-brand/30 hover:text-ink'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Sort
          </button>
        </div>

        {/* Category chips */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none px-4 pb-2.5">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                category === cat.value
                  ? 'bg-brand text-white border-brand shadow-sm'
                  : 'bg-white border-border-dim text-ink-sub hover:border-brand/40 hover:text-ink'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Result count ── */}
      <div className="px-4 pt-2.5 pb-2.5 flex items-center justify-between">
        <p className="text-xs text-ink-sub">
          {loading ? 'Searching…' : (
            <>
              <span className="font-semibold text-ink">{sorted.length}</span>
              {' '}{sorted.length !== 1 ? 'professionals' : 'professional'} found
            </>
          )}
        </p>
        {!loading && sorted.length > 0 && (
          <p className="text-[11px] text-ink-dim font-medium">
            {SORT_OPTIONS.find(s => s.id === sortBy)?.label}
          </p>
        )}
      </div>

      {/* ── Cards ── */}
      <main className="flex-1 px-4 pt-1 flex flex-col gap-2.5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-border-dim p-4 animate-pulse flex gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-surface-alt shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 bg-surface-alt rounded w-28" />
                <div className="h-3 bg-surface-alt rounded w-20" />
                <div className="h-3 bg-surface-alt rounded w-36" />
              </div>
            </div>
          ))
        ) : sorted.length > 0 ? (
          sorted.map(p => {
            const responseTime = p.responseTime
              ? p.responseTime.replace(/^usually responds in\s*/i, '')
              : null;
            const categoryName = p.categories?.[0]?.name ?? 'Professional';
            return (
              <Link
                key={p.id}
                href={`/providers/${p.id}`}
                className="bg-white rounded-2xl border border-border-dim shadow-sm active:scale-[0.98] transition-transform flex gap-3 p-3.5 items-start"
              >
                {/* Avatar with verified overlay */}
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border border-border-dim bg-surface-alt">
                    <img
                      src={p.user?.image || avatarUrl(p.user?.name, 150)}
                      alt={p.user?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {p.isVerified && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-trust rounded-full flex items-center justify-center border-2 border-white">
                      <ShieldCheck className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <h3 className="font-bold text-sm text-ink leading-tight">{p.user?.name}</h3>
                    <ChevronRight className="w-3.5 h-3.5 text-ink-dim/50 shrink-0 mt-0.5" />
                  </div>

                  <p className="text-xs text-ink-sub mb-1.5">{categoryName}</p>

                  <div className="flex items-center gap-1 flex-wrap text-[11px]">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 shrink-0" />
                    <span className="font-bold text-ink">{p.ratingAvg?.toFixed(1) ?? '—'}</span>
                    <span className="text-ink-dim">· {p.completedJobs ?? 0} jobs</span>
                    {responseTime && (
                      <>
                        <span className="text-ink-dim/60 mx-0.5">·</span>
                        <Clock className="w-2.5 h-2.5 text-ink-dim shrink-0" />
                        <span className="text-ink-sub">{responseTime}</span>
                      </>
                    )}
                  </div>

                  <p className="text-[11px] text-ink-sub mt-1.5 line-clamp-1 leading-relaxed">
                    {p.bio && p.bio.trim().length >= 20
                      ? p.bio
                      : `${p.categories?.map((c: any) => c.name).join(', ') || 'Professional'} in ${p.serviceArea || 'Vilnius'}`
                    }
                  </p>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 bg-surface-alt rounded-full flex items-center justify-center mx-auto mb-4">
              <SearchIcon className="w-7 h-7 text-ink-dim" />
            </div>
            <h3 className="font-bold text-base text-ink mb-1">No pros found</h3>
            <p className="text-sm text-ink-sub mb-6">Try a different category or search term.</p>
            <button
              onClick={() => { setCategory(''); setSearch(''); }}
              className="bg-brand text-white px-6 py-3 rounded-xl text-sm font-bold"
            >
              Clear filters
            </button>
          </div>
        )}
      </main>

      {session && <MobileNav />}

      {/* ── Sort bottom sheet ── */}
      {showSortSheet && (
        <>
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-[2px] z-50"
            onClick={() => setShowSortSheet(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 shadow-float">
            <div className="p-5 pb-safe">
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
              <p className="text-xs font-bold text-ink-dim uppercase tracking-widest mb-3 px-1">Sort by</p>
              <div className="space-y-1">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { setSortBy(opt.id); setShowSortSheet(false); }}
                    className={`w-full flex items-center justify-between py-3.5 px-4 rounded-2xl text-sm font-semibold transition-all ${
                      sortBy === opt.id
                        ? 'bg-brand-muted text-brand'
                        : 'text-ink hover:bg-surface-alt'
                    }`}
                  >
                    {opt.label}
                    {sortBy === opt.id && <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-ink-dim" />
      </div>
    }>
      <BrowseContent />
    </Suspense>
  );
}
