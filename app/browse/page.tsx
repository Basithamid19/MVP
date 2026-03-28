'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Star, ShieldCheck, MapPin, Search as SearchIcon,
  Loader2, Clock, ChevronRight, SlidersHorizontal,
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

function BrowseContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const initialCategory = searchParams.get('category') || '';

  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(initialCategory);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (verifiedOnly) params.append('verified', 'true');
        const res = await fetch(`/api/providers?${params.toString()}`);
        const data = await res.json();
        setProviders(Array.isArray(data) ? data : []);
      } catch {
        setProviders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProviders();
  }, [category, verifiedOnly]);

  const filtered = search.trim()
    ? providers.filter(p =>
        p.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.categories?.[0]?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : providers;

  return (
    <div className="min-h-screen bg-canvas overflow-x-hidden w-full flex flex-col pb-28">

      {/* ── Sticky header ── */}
      <header className="bg-white border-b border-border-dim sticky top-0 z-20 w-full">
        <div className="flex items-center gap-3 px-4 h-14">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-dim pointer-events-none" />
            <input
              type="text"
              placeholder="Search professionals..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-surface-alt border border-border-dim rounded-xl text-sm text-ink placeholder:text-ink-dim focus:outline-none focus:ring-2 focus:ring-brand/30 transition"
            />
          </div>
          <button
            onClick={() => setVerifiedOnly(v => !v)}
            className={`flex items-center gap-1.5 px-3 h-9 rounded-xl border text-xs font-semibold transition shrink-0 ${
              verifiedOnly
                ? 'bg-brand text-white border-brand'
                : 'bg-surface-alt border-border-dim text-ink-sub'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified
          </button>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none px-4 pb-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition ${
                category === cat.value
                  ? 'bg-brand text-white border-brand'
                  : 'bg-white border-border-dim text-ink-sub'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Result count ── */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-xs font-semibold text-ink-dim uppercase tracking-widest">
          {loading ? 'Loading…' : `${filtered.length} professional${filtered.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* ── Cards ── */}
      <main className="flex-1 px-4 flex flex-col gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-border-dim p-4 animate-pulse flex gap-3">
              <div className="w-14 h-14 rounded-2xl bg-surface-alt shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 bg-surface-alt rounded w-28" />
                <div className="h-3 bg-surface-alt rounded w-20" />
                <div className="h-3 bg-surface-alt rounded w-36" />
              </div>
            </div>
          ))
        ) : filtered.length > 0 ? (
          filtered.map(p => {
            const responseTime = p.responseTime
              ? p.responseTime.replace(/^usually responds in\s*/i, '')
              : null;
            const categoryName = p.categories?.[0]?.name ?? 'Professional';
            return (
              <Link
                key={p.id}
                href={`/providers/${p.id}`}
                className="bg-white rounded-2xl border border-border-dim shadow-sm active:scale-[0.98] transition-transform flex gap-3 p-4 items-start"
              >
                {/* Avatar */}
                <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-border-dim bg-surface-alt">
                  <img
                    src={p.user?.image || avatarUrl(p.user?.name, 150)}
                    alt={p.user?.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h3 className="font-bold text-sm text-ink truncate">{p.user?.name}</h3>
                      {p.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-trust shrink-0" />}
                    </div>
                    <ChevronRight className="w-4 h-4 text-ink-dim shrink-0 mt-0.5" />
                  </div>

                  <p className="text-xs text-ink-sub mb-1.5">{categoryName}</p>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-bold text-ink">{p.ratingAvg?.toFixed(1) ?? '—'}</span>
                      <span className="text-[11px] text-ink-dim">({p.completedJobs ?? 0} jobs)</span>
                    </div>
                    {responseTime && (
                      <div className="flex items-center gap-1 text-[11px] text-ink-sub">
                        <Clock className="w-3 h-3 text-ink-dim shrink-0" />
                        <span>{responseTime}</span>
                      </div>
                    )}
                  </div>

                  {p.bio && (
                    <p className="text-[11px] text-ink-dim mt-1.5 line-clamp-1 leading-relaxed">{p.bio}</p>
                  )}
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
            <p className="text-sm text-ink-sub mb-6">Try a different category or remove the verified filter.</p>
            <button
              onClick={() => { setCategory(''); setVerifiedOnly(false); setSearch(''); }}
              className="bg-brand text-white px-6 py-3 rounded-xl text-sm font-bold"
            >
              Clear filters
            </button>
          </div>
        )}
      </main>

      {session && <MobileNav />}
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
