'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ChevronRight, Lightbulb, Tv, PlugZap, Zap, CircuitBoard, Box, Wrench, Bath, ShowerHead, Flame, Waves, Pipe, SprayCan, Wind, Sofa, PictureInPicture, DoorOpen, Hammer, Truck, PackageOpen, MoveRight, Building2, Paintbrush, RectangleHorizontal, Rows3, Triangle, PenLine } from 'lucide-react';
import Link from 'next/link';
import MobileNav from '@/components/MobileNav';
import { useSession } from 'next-auth/react';
import { BroomIcon, ElectricianIcon } from '@/components/icons';

/* ─── Subcategory data ─── */

interface SubItem {
  label: string;
  slug: string;
  icon: React.ElementType;
}

interface CategoryData {
  label: string;
  description: string;
  items: SubItem[];
}

const SUBCATEGORIES: Record<string, CategoryData> = {
  electrician: {
    label: 'Electrician',
    description: 'What electrical work do you need?',
    items: [
      { label: 'Light bulb replacement', slug: 'light-bulb-replacement', icon: Lightbulb },
      { label: 'TV / appliance mounting', slug: 'tv-mounting', icon: Tv },
      { label: 'Socket installation', slug: 'socket-installation', icon: PlugZap },
      { label: 'Rewiring', slug: 'rewiring', icon: Zap },
      { label: 'Fuse box repair', slug: 'fuse-box-repair', icon: CircuitBoard },
      { label: 'Circuit breaker issue', slug: 'circuit-breaker', icon: Box },
    ],
  },
  plumber: {
    label: 'Plumber',
    description: 'What plumbing work do you need?',
    items: [
      { label: 'Fix leaking tap', slug: 'leaking-tap', icon: Wrench },
      { label: 'Toilet repair', slug: 'toilet-repair', icon: Bath },
      { label: 'Shower installation', slug: 'shower-installation', icon: ShowerHead },
      { label: 'Boiler service', slug: 'boiler-service', icon: Flame },
      { label: 'Drain unblocking', slug: 'drain-unblocking', icon: Waves },
      { label: 'Pipe repair', slug: 'pipe-repair', icon: Hammer },
    ],
  },
  cleaning: {
    label: 'Cleaning',
    description: 'What type of cleaning do you need?',
    items: [
      { label: 'Regular home cleaning', slug: 'regular-cleaning', icon: BroomIcon },
      { label: 'Deep cleaning', slug: 'deep-cleaning', icon: SprayCan },
      { label: 'End of tenancy', slug: 'end-of-tenancy', icon: Building2 },
      { label: 'Window cleaning', slug: 'window-cleaning', icon: Wind },
      { label: 'Carpet cleaning', slug: 'carpet-cleaning', icon: RectangleHorizontal },
      { label: 'Office cleaning', slug: 'office-cleaning', icon: Rows3 },
    ],
  },
  handyman: {
    label: 'Handyman',
    description: 'What do you need fixed or assembled?',
    items: [
      { label: 'Furniture assembly', slug: 'furniture-assembly', icon: Sofa },
      { label: 'Shelf / picture hanging', slug: 'shelf-hanging', icon: PictureInPicture },
      { label: 'Door repair', slug: 'door-repair', icon: DoorOpen },
      { label: 'Minor repairs', slug: 'minor-repairs', icon: Hammer },
      { label: 'Appliance installation', slug: 'appliance-install', icon: Box },
      { label: 'General maintenance', slug: 'general-maintenance', icon: Wrench },
    ],
  },
  'moving-help': {
    label: 'Moving Help',
    description: 'What kind of moving help do you need?',
    items: [
      { label: 'Apartment move', slug: 'apartment-move', icon: Truck },
      { label: 'Furniture removal', slug: 'furniture-removal', icon: MoveRight },
      { label: 'Packing assistance', slug: 'packing', icon: PackageOpen },
      { label: 'Heavy item move', slug: 'heavy-item', icon: Box },
      { label: 'Office move', slug: 'office-move', icon: Building2 },
      { label: 'Storage help', slug: 'storage', icon: Rows3 },
    ],
  },
  painting: {
    label: 'Painting',
    description: 'What painting work do you need?',
    items: [
      { label: 'Interior painting', slug: 'interior-painting', icon: Paintbrush },
      { label: 'Feature wall', slug: 'feature-wall', icon: RectangleHorizontal },
      { label: 'Ceiling painting', slug: 'ceiling-painting', icon: Triangle },
      { label: 'Exterior painting', slug: 'exterior-painting', icon: Building2 },
      { label: 'Fence painting', slug: 'fence-painting', icon: Rows3 },
      { label: 'Touch-up & repairs', slug: 'touch-up', icon: PenLine },
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

  const handleSelect = (subSlug: string, subLabel: string) => {
    const p = new URLSearchParams({ category: slug, subcategory: subSlug, description: subLabel });
    router.push(`/requests/new?${p.toString()}`);
  };

  const handleSomethingElse = () => {
    router.push(`/requests/new?category=${slug}`);
  };

  return (
    <div className="min-h-screen bg-canvas overflow-x-hidden w-full flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-border-dim sticky top-0 z-20 w-full">
        <div className="flex items-center gap-3 px-4 h-14">
          <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-alt transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5 text-ink" />
          </Link>
          <h1 className="font-semibold text-base text-ink truncate">{category.label}</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 pt-6 pb-32 w-full">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-ink mb-1">{category.description}</h2>
          <p className="text-sm text-ink-sub">Select an option or describe your own below.</p>
        </div>

        {/* Subcategory grid — 2 columns */}
        <div className="grid grid-cols-2 gap-3 w-full mb-4">
          {category.items.map(({ label, slug: subSlug, icon: Icon }) => (
            <button
              key={subSlug}
              onClick={() => handleSelect(subSlug, label)}
              className="bg-white border border-border-dim rounded-2xl p-4 flex flex-col items-start gap-3 text-left active:scale-95 active:bg-surface-alt transition-all shadow-sm hover:border-brand/30 hover:shadow-md w-full"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-muted flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-brand" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-semibold text-ink leading-snug">{label}</span>
            </button>
          ))}
        </div>

        {/* Something else */}
        <button
          onClick={handleSomethingElse}
          className="w-full flex items-center justify-between bg-white border border-border-dim rounded-2xl px-4 py-4 text-sm font-semibold text-ink-sub hover:text-ink hover:border-border active:bg-surface-alt transition-all shadow-sm"
        >
          <span>Something else…</span>
          <ChevronRight className="w-4 h-4 shrink-0" />
        </button>
      </main>

      {session && <MobileNav />}
    </div>
  );
}
