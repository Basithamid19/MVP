'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, ChevronRight,
  Wrench, Zap, Hammer, Truck, Paintbrush,
  Lightbulb, Tv, Plug, Shield, AlertTriangle,
  Droplets, Waves, Flame, Filter,
  Home, Key, Wind, Layers, Building2,
  Image, DoorOpen, Package, Settings,
  Archive, Star,
} from 'lucide-react';
import Link from 'next/link';
import MobileNav from '@/components/MobileNav';
import { useSession } from 'next-auth/react';
import { BroomIcon, ElectricianIcon } from '@/components/icons';

/* ─── Subcategory data ─── */

const SUBCATEGORIES: Record<string, {
  label: string;
  description: string;
  Icon: React.ElementType;
  items: { label: string; slug: string; Icon: React.ElementType }[];
}> = {
  electrician: {
    label: 'Electrician',
    description: 'What electrical work do you need?',
    Icon: ElectricianIcon,
    items: [
      { label: 'Light bulb replacement', slug: 'light-bulb-replacement', Icon: Lightbulb },
      { label: 'TV / appliance mounting', slug: 'tv-mounting', Icon: Tv },
      { label: 'Socket installation', slug: 'socket-installation', Icon: Plug },
      { label: 'Rewiring', slug: 'rewiring', Icon: Zap },
      { label: 'Fuse box repair', slug: 'fuse-box-repair', Icon: Shield },
      { label: 'Circuit breaker issue', slug: 'circuit-breaker', Icon: AlertTriangle },
    ],
  },
  plumber: {
    label: 'Plumber',
    description: 'What plumbing work do you need?',
    Icon: Wrench,
    items: [
      { label: 'Fix leaking tap', slug: 'leaking-tap', Icon: Droplets },
      { label: 'Toilet repair', slug: 'toilet-repair', Icon: Wrench },
      { label: 'Shower installation', slug: 'shower-installation', Icon: Waves },
      { label: 'Boiler service', slug: 'boiler-service', Icon: Flame },
      { label: 'Drain unblocking', slug: 'drain-unblocking', Icon: Filter },
      { label: 'Pipe repair', slug: 'pipe-repair', Icon: Settings },
    ],
  },
  cleaning: {
    label: 'Cleaning',
    description: 'What type of cleaning do you need?',
    Icon: BroomIcon,
    items: [
      { label: 'Regular home cleaning', slug: 'regular-cleaning', Icon: Home },
      { label: 'Deep cleaning', slug: 'deep-cleaning', Icon: Star },
      { label: 'End of tenancy', slug: 'end-of-tenancy', Icon: Key },
      { label: 'Window cleaning', slug: 'window-cleaning', Icon: Wind },
      { label: 'Carpet cleaning', slug: 'carpet-cleaning', Icon: Layers },
      { label: 'Office cleaning', slug: 'office-cleaning', Icon: Building2 },
    ],
  },
  handyman: {
    label: 'Handyman',
    description: 'What do you need fixed or assembled?',
    Icon: Hammer,
    items: [
      { label: 'Furniture assembly', slug: 'furniture-assembly', Icon: Package },
      { label: 'Shelf / picture hanging', slug: 'shelf-hanging', Icon: Image },
      { label: 'Door repair', slug: 'door-repair', Icon: DoorOpen },
      { label: 'Appliance installation', slug: 'appliance-install', Icon: Plug },
      { label: 'Minor repairs', slug: 'minor-repairs', Icon: Hammer },
      { label: 'General maintenance', slug: 'general-maintenance', Icon: Settings },
    ],
  },
  'moving-help': {
    label: 'Moving Help',
    description: 'What kind of moving help do you need?',
    Icon: Truck,
    items: [
      { label: 'Apartment move', slug: 'apartment-move', Icon: Home },
      { label: 'Furniture removal', slug: 'furniture-removal', Icon: Truck },
      { label: 'Packing assistance', slug: 'packing', Icon: Package },
      { label: 'Heavy item move', slug: 'heavy-item', Icon: Hammer },
      { label: 'Office move', slug: 'office-move', Icon: Building2 },
      { label: 'Storage help', slug: 'storage', Icon: Archive },
    ],
  },
  painting: {
    label: 'Painting',
    description: 'What painting work do you need?',
    Icon: Paintbrush,
    items: [
      { label: 'Interior painting', slug: 'interior-painting', Icon: Home },
      { label: 'Feature wall', slug: 'feature-wall', Icon: Layers },
      { label: 'Ceiling painting', slug: 'ceiling-painting', Icon: Building2 },
      { label: 'Exterior painting', slug: 'exterior-painting', Icon: Star },
      { label: 'Fence painting', slug: 'fence-painting', Icon: Shield },
      { label: 'Touch-up & repairs', slug: 'touch-up', Icon: Paintbrush },
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

        {/* Subcategory grid */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {category.items.map(({ label, slug: subSlug, Icon: SubIcon }) => (
            <button
              key={subSlug}
              onClick={() => handleSelect(subSlug, label)}
              className="flex flex-col items-center justify-center bg-white border border-border-dim rounded-2xl p-4 text-center active:scale-[0.97] active:bg-surface-alt transition-all shadow-sm hover:border-brand/30 hover:shadow-md gap-3"
            >
              <div className="w-14 h-14 bg-brand-muted rounded-2xl flex items-center justify-center shrink-0">
                <SubIcon className="w-7 h-7 text-brand" strokeWidth={1.5} />
              </div>
              <span className="text-xs font-semibold text-ink leading-tight">{label}</span>
            </button>
          ))}
        </div>

        {/* Something else */}
        <button
          onClick={() => router.push(`/requests/new?category=${slug}`)}
          className="w-full flex items-center justify-between bg-transparent border border-dashed border-border rounded-2xl px-4 py-4 text-left active:bg-surface-alt transition-all mt-3"
        >
          <span className="text-sm font-medium text-ink-sub">Something else…</span>
          <ChevronRight className="w-4 h-4 text-ink-dim shrink-0 ml-2" />
        </button>
      </main>

      {session && <MobileNav />}
    </div>
  );
}
