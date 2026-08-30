'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ChevronRight, Compass, Users } from 'lucide-react';
import Link from 'next/link';
import { PageHeader, EmptyState, Button, buttonVariants, SkeletonCard } from '@/components/ui';
import CustomerLayout from '@/components/CustomerLayout';
import ProviderCard, { categoryTheme } from '@/components/ProviderCard';
import { SUBCATEGORIES } from '@/lib/subcategories';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** How many pros the category page previews before deferring to /browse. */
const PREVIEW_COUNT = 4;

export default function CategoryPage() {
  const router = useRouter();
  const params = useParams();
  const t      = useTranslation();
  const slug   = params?.slug as string;
  const category = SUBCATEGORIES[slug];

  const [providers, setProviders] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);

  // Pros are a preview on this page — the picker above is still the primary
  // action, so a failed fetch just collapses the section, never the page.
  useEffect(() => {
    if (!category) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res  = await fetch(`/api/providers?category=${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (!cancelled) setProviders(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setProviders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug, category]);

  // Unknown slug — a real empty state instead of a redirect mid-render.
  if (!category) {
    return (
      <CustomerLayout maxWidth="max-w-3xl">
        <EmptyState
          icon={Compass}
          size="lg"
          title={t.categoryPage.notFoundTitle}
          description={t.categoryPage.notFoundDesc}
          action={
            <Link href="/browse" className={buttonVariants({ variant: 'primary', size: 'lg' })}>
              {t.providerProfile.backToBrowse}
            </Link>
          }
        />
      </CustomerLayout>
    );
  }

  const { Icon } = category;
  const theme    = categoryTheme(slug);

  const handleSelect = (subSlug: string, subLabel: string) => {
    const p = new URLSearchParams({ category: slug, subcategory: subSlug, description: subLabel });
    router.push(`/requests/new?${p.toString()}`);
  };

  return (
    <CustomerLayout maxWidth="max-w-3xl">

      {/* Back */}
      <Link
        href="/"
        className="w-9 h-9 mb-3 flex items-center justify-center rounded-input border border-border-dim bg-card hover:bg-surface-alt transition-colors duration-150 shrink-0"
        aria-label={t.common.back}
      >
        <ArrowLeft className="w-5 h-5 text-ink" />
      </Link>

      {/* Category identity band — the profile cover treatment, tinted per category */}
      <div className={cn('relative overflow-hidden rounded-panel px-5 py-5 sm:px-6 sm:py-6 mb-5', theme.bg)}>
        {/* Decorative watermark — wrapped so custom (non-lucide) category icons
            that only accept className/strokeWidth still get hidden from AT. */}
        <span aria-hidden="true" className="absolute -right-4 -bottom-6 pointer-events-none">
          <Icon className={cn('w-32 h-32 opacity-20', theme.ink)} strokeWidth={1} />
        </span>
        <div className="relative flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-card bg-card/70 flex items-center justify-center shrink-0">
            <Icon className={cn('w-6 h-6', theme.ink)} strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <h1 className={cn('text-xl sm:text-2xl font-bold tracking-tight truncate', theme.ink)}>
              {category.label}
            </h1>
            <p className={cn('text-xs font-semibold opacity-75', theme.ink)}>
              {loading
                ? t.common.loading
                : `${providers.length} ${providers.length === 1 ? t.categoryPage.proAvailable : t.categoryPage.prosAvailable}`}
            </p>
          </div>
        </div>
      </div>

      <PageHeader
        title={category.description}
        description="Tap an option or describe your own."
        className="mb-6"
      />

      {/* Subcategory grid */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {category.items.map(({ label, slug: subSlug, Icon: SubIcon }) => (
          <button
            key={subSlug}
            onClick={() => handleSelect(subSlug, label)}
            className="flex flex-col items-center justify-center bg-card border border-border-dim rounded-card p-4 text-center transition-all duration-150 shadow-card hover:border-brand/30 hover:shadow-elevated hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] gap-3"
          >
            <div className={cn('w-14 h-14 rounded-card flex items-center justify-center shrink-0', theme.bg)}>
              <SubIcon className={cn('w-7 h-7', theme.ink)} strokeWidth={1.5} />
            </div>
            <span className="text-xs font-semibold text-ink leading-tight">{label}</span>
          </button>
        ))}
      </div>

      {/* Something else */}
      <button
        onClick={() => router.push(`/requests/new?category=${slug}`)}
        className="w-full flex items-center justify-between bg-transparent border border-dashed border-border rounded-card px-4 py-4 text-left hover:border-brand/40 hover:bg-surface-alt transition-all duration-150 mt-3"
      >
        <span className="text-sm font-medium text-ink-sub">Something else…</span>
        <ChevronRight className="w-4 h-4 text-ink-dim shrink-0 ml-2" />
      </button>

      {/* Pros in this category */}
      <section className="mt-8">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-ink-dim">
            {t.categoryPage.prosInPrefix} {category.label}
          </h2>
          {!loading && providers.length > PREVIEW_COUNT && (
            <Link
              href={`/browse?category=${slug}`}
              className="text-xs font-bold text-brand hover:text-brand-dark transition-colors duration-150 shrink-0"
            >
              {t.services.viewAll}
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : providers.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {providers.slice(0, PREVIEW_COUNT).map(p => (
              <ProviderCard key={p.id} provider={p} t={t} size="row" />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            size="sm"
            title={t.browse.noProvidersFound}
            description={t.categoryPage.emptyProsDesc}
            action={
              <Button variant="secondary" size="md" onClick={() => router.push(`/requests/new?category=${slug}`)}>
                {t.categoryPage.postJob}
              </Button>
            }
            className="bg-card rounded-card border border-border-dim"
          />
        )}
      </section>
    </CustomerLayout>
  );
}
