import {
  Wrench, Zap, Hammer, Truck, Paintbrush,
  Lightbulb, Tv, Plug, Shield, AlertTriangle,
  Droplets, Waves, Flame, Filter,
  Home, Key, Wind, Layers, Building2,
  Image, DoorOpen, Package, Settings,
  Archive, Star,
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
