'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ChevronRight, Wrench, Zap, Hammer, Truck, Paintbrush, Star } from 'lucide-react';
import Link from 'next/link';
import MobileNav from '@/components/MobileNav';
import { useSession } from 'next-auth/react';
import { BroomIcon, ElectricianIcon } from '@/components/icons';

/* ─── Subcategory data ─── */

const SUBCATEGORIES: Record<string, {
  label: string;
  description: string;
  Icon: React.ElementType;
  items: { label: string; slug: string }[];
}> = {
  electrician: {
    label: 'Electrician',
    description: 'What electrical work do you need?',
    Icon: ElectricianIcon,
    items: [
      { label: 'Light bulb replacement', slug: 'light-bulb-replacement' },
      { label: 'TV / appliance mounting', slug: 'tv-mounting' },
      { label: 'Socket installation', slug: 'socket-installation' },
      { label: 'Rewiring', slug: 'rewiring' },
      { label: 'Fuse box repair', slug: 'fuse-box-repair' },
      { label: 'Circuit breaker issue', slug: 'circuit-breaker' },
    ],
  },
  plumber: {
    label: 'Plumber',
    description: 'What plumbing work do you need?',
    Icon: Wrench,
    items: [
      { label: 'Fix leaking tap', slug: 'leaking-tap' },
      { label: 'Toilet repair', slug: 'toilet-repair' },
      { label: 'Shower installation', slug: 'shower-installation' },
      { label: 'Boiler service', slug: 'boiler-service' },
      { label: 'Drain unblocking', slug: 'drain-unblocking' },
      { label: 'Pipe repair', slug: 'pipe-repair' },
    ],
  },
  cleaning: {
    label: 'Cleaning',
    description: 'What type of cleaning do you need?',
    Icon: BroomIcon,
    items: [
      { label: 'Regular home cleaning', slug: 'regular-cleaning' },
      { label: 'Deep cleaning', slug: 'deep-cleaning' },
      { label: 'End of tenancy cleaning', slug: 'end-of-tenancy' },
      { label: 'Window cleaning', slug: 'window-cleaning' },
      { label: 'Carpet cleaning', slug: 'carpet-cleaning' },
      { label: 'Office cleaning', slug: 'office-cleaning' },
    ],
  },
  handyman: {
    label: 'Handyman',
    description: 'What do you need fixed or assembled?',
    Icon: Hammer,
    items: [
      { label: 'Furniture assembly', slug: 'furniture-assembly' },
      { label: 'Shelf / picture hanging', slug: 'shelf-hanging' },
      { label: 'Door repair', slug: 'door-repair' },
      { label: 'Appliance installation', slug: 'appliance-install' },
      { label: 'Minor repairs', slug: 'minor-repairs' },
      { label: 'General maintenance', slug: 'general-maintenance' },
    ],
  },
  'moving-help': {
    label: 'Moving Help',
    description: 'What kind of moving help do you need?',
    Icon: Truck,
    items: [
      { label: 'Apartment move', slug: 'apartment-move' },
      { label: 'Furniture removal', slug: 'furniture-removal' },
      { label: 'Packing assistance', slug: 'packing' },
      { label: 'Heavy item move', slug: 'heavy-item' },
      { label: 'Office move', slug: 'office-move' },
      { label: 'Storage help', slug: 'storage' },
    ],
  },
  painting: {
    label: 'Painting',
    description: 'What painting work do you need?',
    Icon: Paintbrush,
    items: [
      { label: 'Interior painting', slug: 'interior-painting' },
      { label: 'Feature wall', slug: 'feature-wall' },
      { label: 'Ceiling painting', slug: 'ceiling-painting' },
      { label: 'Exterior painting', slug: 'exterior-painting' },
      { label: 'Fence painting', slug: 'fence-painting' },
      { label: 'Touch-up & repairs', slug: 'touch-up' },
    ],
  },
};

export default function CategoryPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
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
    <div className="min-h-screen bg-canvas overflow-x-hidden w-full flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-border-dim sticky top-0 z-20 w-full">
        <div className="flex items-center gap-3 px-4 h-14">
          <Link
            href="/"
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-alt transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-ink" />
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 bg-brand-muted rounded-lg flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-brand" strokeWidth={1.5} />
            </div>
            <h1 className="font-semibold text-base text-ink truncate">{category.label}</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 pt-6 pb-32 w-full">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-ink mb-1">{category.description}</h2>
          <p className="text-sm text-ink-sub">Tap an option or describe your own.</p>
        </div>

        {/* Subcategory list */}
        <div className="flex flex-col gap-2 w-full">
          {category.items.map(({ label, slug: subSlug }) => (
            <button
              key={subSlug}
              onClick={() => handleSelect(subSlug, label)}
              className="w-full flex items-center justify-between bg-white border border-border-dim rounded-2xl px-4 py-4 text-left active:scale-[0.98] active:bg-surface-alt transition-all shadow-sm hover:border-brand/30"
            >
              <span className="text-sm font-semibold text-ink">{label}</span>
              <ChevronRight className="w-4 h-4 text-ink-dim shrink-0 ml-2" />
            </button>
          ))}

          {/* Something else */}
          <button
            onClick={() => router.push(`/requests/new?category=${slug}`)}
            className="w-full flex items-center justify-between bg-transparent border border-dashed border-border rounded-2xl px-4 py-4 text-left active:bg-surface-alt transition-all mt-1"
          >
            <span className="text-sm font-medium text-ink-sub">Something else…</span>
            <ChevronRight className="w-4 h-4 text-ink-dim shrink-0 ml-2" />
          </button>
        </div>
      </main>

      {session && <MobileNav />}
    </div>
  );
}
