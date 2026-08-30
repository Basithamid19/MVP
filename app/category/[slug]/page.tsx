'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import CustomerLayout from '@/components/CustomerLayout';
import { SUBCATEGORIES } from '@/lib/subcategories';

export default function CategoryPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const category = SUBCATEGORIES[slug];

  if (!category) {
    router.push('/browse');
    return null;
  }

  const { Icon } = category;

  const handleSelect = (subSlug: string, subLabel: string) => {
    const p = new URLSearchParams({ category: slug, subcategory: subSlug, description: subLabel });
    router.push(`/requests/new?${p.toString()}`);
  };

  return (
    <CustomerLayout maxWidth="max-w-3xl">

      {/* Category identity + back */}
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/"
          className="w-9 h-9 flex items-center justify-center rounded-input border border-border-dim bg-card hover:bg-surface-alt transition-colors shrink-0"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-ink" />
        </Link>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 bg-brand-muted rounded-input flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-brand" strokeWidth={1.5} />
          </div>
          <p className="font-semibold text-base text-ink truncate">{category.label}</p>
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
              className="flex flex-col items-center justify-center bg-card border border-border-dim rounded-card p-4 text-center active:scale-[0.97] active:bg-surface-alt transition-all shadow-card hover:border-brand/30 hover:shadow-md gap-3"
            >
              <div className="w-14 h-14 bg-brand-muted rounded-card flex items-center justify-center shrink-0">
                <SubIcon className="w-7 h-7 text-brand" strokeWidth={1.5} />
              </div>
              <span className="text-xs font-semibold text-ink leading-tight">{label}</span>
            </button>
          ))}
        </div>

        {/* Something else */}
        <button
          onClick={() => router.push(`/requests/new?category=${slug}`)}
          className="w-full flex items-center justify-between bg-transparent border border-dashed border-border rounded-card px-4 py-4 text-left active:bg-surface-alt transition-all mt-3"
        >
          <span className="text-sm font-medium text-ink-sub">Something else…</span>
          <ChevronRight className="w-4 h-4 text-ink-dim shrink-0 ml-2" />
        </button>
    </CustomerLayout>
  );
}
