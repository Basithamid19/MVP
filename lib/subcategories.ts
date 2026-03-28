import {
  Wrench, Zap, Hammer, Truck, Package,
  Lightbulb, Tv, Plug, Shield, AlertTriangle,
  Droplets, Waves, Flame, Filter,
  Home, Key, Wind, Layers, Building2,
  Image, DoorOpen, Settings,
  Archive, Star, Sofa, RefreshCw,
} from 'lucide-react';
import type { ElementType } from 'react';
import { BroomIcon, ElectricianIcon } from '@/components/icons';

export interface SubcategoryItem {
  label: string;
  slug: string;
  Icon: ElementType;
}

export interface CategorySubcategories {
  label: string;
  description: string;
  Icon: ElementType;
  items: SubcategoryItem[];
}

export const SUBCATEGORIES: Record<string, CategorySubcategories> = {
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
      { label: 'Shelf / picture hanging', slug: 'shelf-hanging', Icon: Image },
      { label: 'Door repair', slug: 'door-repair', Icon: DoorOpen },
      { label: 'Appliance installation', slug: 'appliance-install', Icon: Plug },
      { label: 'Minor repairs', slug: 'minor-repairs', Icon: Hammer },
      { label: 'General maintenance', slug: 'general-maintenance', Icon: Settings },
      { label: 'Other repairs', slug: 'other-repairs', Icon: RefreshCw },
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
  'furniture-assembly': {
    label: 'Furniture Assembly',
    description: 'What do you need assembled?',
    Icon: Package,
    items: [
      { label: 'IKEA assembly', slug: 'ikea-assembly', Icon: Package },
      { label: 'Wardrobe assembly', slug: 'wardrobe-assembly', Icon: Sofa },
      { label: 'Bed frame assembly', slug: 'bed-assembly', Icon: Sofa },
      { label: 'Office furniture', slug: 'office-furniture', Icon: Building2 },
      { label: 'Shelving unit', slug: 'shelving-unit', Icon: Layers },
      { label: 'Disassembly & pack', slug: 'disassembly', Icon: RefreshCw },
    ],
  },
};
