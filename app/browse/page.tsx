'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search as SearchIcon, SlidersHorizontal, CheckCircle2, ArrowLeft,
} from 'lucide-react';
import CustomerLayout from '@/components/CustomerLayout';
import ProviderCard from '@/components/ProviderCard';
import { Button, EmptyState, Modal, Skeleton, SkeletonCard } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';
import type { Dictionary } from '@/lib/i18n';

/** Category filters — values are the real seeded slugs. */
function categoryOptions(t: Dictionary) {
  return [
    { label: t.browse.all,                     value: '' },
    { label: t.categories.electrician,         value: 'electrician' },
    { label: t.categories.plumber,             value: 'plumber' },
    { label: t.categories.cleaning,            value: 'cleaning' },
    { label: t.categories.handyman,            value: 'handyman' },
    { label: t.categories.movingHelp,          value: 'moving-help' },
    { label: t.categories.furnitureAssembly,   value: 'furniture-assembly' },
  ];
}

function sortOptions(t: Dictionary) {
  return [
    { id: 'top_rated',     label: t.browse.topRated },
    { id: 'most_reviewed', label: t.browse.mostReviewed },
    { id: 'fastest',       label: t.browse.fastestResponse },
  ];
}

function parseResponseMinutes(rt: string | null): number {
  if (!rt) return 9999;
  const m = rt.toLowerCase().match(/(\d+)\s*(min|hour|day)/);
  if (!m) return 9999;
  const n = parseInt(m[1]);
  if (m[2].startsWith('min'))  return n;
  if (m[2].startsWith('hour')) return n * 60;
  return n * 1440;
}

/* One filter group renderer — used by the desktop sidebar and the mobile
   filter sheet, so the two can never drift apart again. */
function FilterGroup({
  label,
  options,
  value,
  onSelect,
}: {
  label:    string;
  options:  { label: string; value: string }[];
  value:    string;
  onSelect: (value: string) => void;
}) {
  return (
    <div>
      <h3 className="text-2xs font-bold text-ink-dim uppercase tracking-widest mb-2 px-3">
        {label}
      </h3>
      <div className="space-y-0.5">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-input text-sm font-medium transition-colors duration-150 ${
              value === opt.value
                ? 'bg-brand-muted text-brand'
                : 'text-ink-sub hover:bg-surface-alt hover:text-ink'
            }`}
          >
            {opt.label}
            {value === opt.value && <CheckCircle2 className="w-4 h-4 shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function BrowseContent() {
  const searchParams    = useSearchParams();
  const router          = useRouter();
  const t               = useTranslation();
  const initialCategory = searchParams.get('category') || '';

  const CATEGORIES   = categoryOptions(t);
  const SORT_OPTIONS = sortOptions(t);

  const [providers,     setProviders]     = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [category,      setCategory]      = useState(initialCategory);
  const [search,        setSearch]        = useState('');
  const [sortBy,        setSortBy]        = useState('top_rated');
  const [showFilters,   setShowFilters]   = useState(false);

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

  // Badge on the mobile Filters button — how many non-default filters are on.
  const activeFilters = (category ? 1 : 0) + (sortBy !== 'top_rated' ? 1 : 0);

  return (
    <CustomerLayout maxWidth="max-w-7xl">

      {/* ── Search / filter toolbar (the shell owns the header, bell and nav) ── */}
      <div className="mb-3">
        <div className="flex items-center gap-2.5">

          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-card bg-surface-alt border border-border-dim text-ink-sub hover:text-ink hover:border-brand/30 transition-all duration-150 shrink-0"
            aria-label={t.common.back}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Search field */}
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-dim pointer-events-none" />
            <input
              type="text"
              placeholder={t.browse.searchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-3 bg-surface-alt border border-border-dim rounded-card text-base sm:text-sm text-ink placeholder:text-ink-dim focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus:bg-card focus:border-brand/20 transition-all duration-150"
            />
          </div>

          {/* Filters — mobile only (desktop uses the sidebar) */}
          <button
            onClick={() => setShowFilters(true)}
            className={`lg:hidden flex items-center gap-1.5 px-3.5 h-10 rounded-card border text-xs font-bold transition-all duration-150 shrink-0 ${
              activeFilters
                ? 'bg-brand-muted text-brand border-brand/30'
                : 'bg-surface-alt border-border-dim text-ink-sub hover:border-brand/30 hover:text-ink'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {t.browse.filters}
            {activeFilters > 0 && (
              <span className="ml-0.5 w-4 h-4 rounded-full bg-brand text-white text-3xs font-bold flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {/* Category chips — mobile quick-switch (desktop uses the sidebar) */}
        <div className="lg:hidden flex gap-1.5 overflow-x-auto scrollbar-none pt-2.5">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-150 ${
                category === cat.value
                  ? 'bg-brand text-white border-brand shadow-card'
                  : 'bg-card border-border-dim text-ink-sub hover:border-brand/40 hover:text-ink'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body: filter sidebar (desktop) + results ── */}
      <div className="lg:flex lg:gap-8">

        {/* Filter sidebar — desktop only. Same groups as the mobile sheet. */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24 space-y-7">
            <FilterGroup label={t.browse.categoriesLabel} options={CATEGORIES}   value={category} onSelect={setCategory} />
            <FilterGroup label={t.browse.sortByLabel}    options={SORT_OPTIONS.map(o => ({ label: o.label, value: o.id }))} value={sortBy} onSelect={setSortBy} />
          </div>
        </aside>

        {/* Results */}
        <main className="flex-1 min-w-0">
          {/* Result count + active sort */}
          <div className="pt-1 pb-2.5 flex items-center justify-between gap-3">
            <p className="text-xs text-ink-sub">
              {loading ? `${t.common.loading}` : (
                <>
                  <span className="font-semibold text-ink">{sorted.length}</span>
                  {' '}{sorted.length !== 1 ? t.browse.professionalsFound : t.browse.professionalFound}
                </>
              )}
            </p>
            {!loading && sorted.length > 0 && (
              <p className="text-2xs text-ink-dim font-medium lg:hidden">
                {SORT_OPTIONS.find(s => s.id === sortBy)?.label}
              </p>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : sorted.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sorted.map(p => (
                <ProviderCard key={p.id} provider={p} t={t} size="row" />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={SearchIcon}
              size="lg"
              title={t.browse.noProvidersFound}
              description={t.browse.tryDifferent}
              action={
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => { setCategory(''); setSearch(''); setSortBy('top_rated'); }}
                >
                  {t.browse.clearFilters}
                </Button>
              }
            />
          )}
        </main>
      </div>

      {/* ── Filter sheet (mobile) — the FULL filter set, matching the sidebar ── */}
      <Modal
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title={t.browse.filters}
        size="sm"
      >
        <div className="space-y-6 -mx-2">
          <FilterGroup label={t.browse.categoriesLabel} options={CATEGORIES}   value={category} onSelect={setCategory} />
          <FilterGroup label={t.browse.sortByLabel}    options={SORT_OPTIONS.map(o => ({ label: o.label, value: o.id }))} value={sortBy} onSelect={setSortBy} />
        </div>

        <div className="flex gap-3 pt-5 mt-5 border-t border-border-dim">
          <Button
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={() => { setCategory(''); setSortBy('top_rated'); }}
          >
            {t.browse.clearAll}
          </Button>
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            onClick={() => setShowFilters(false)}
          >
            {t.browse.showResults}
          </Button>
        </div>
      </Modal>
    </CustomerLayout>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-canvas px-4 sm:px-6 lg:px-10 pt-4">
        <div className="max-w-7xl mx-auto">
          <Skeleton rounded="card" className="h-10 w-full mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    }>
      <BrowseContent />
    </Suspense>
  );
}
