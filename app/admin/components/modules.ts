import type { ElementType } from 'react';
import {
  BarChart3, ShieldCheck, Briefcase, DollarSign, Star,
  Settings, Users, FileWarning, FileText,
} from 'lucide-react';

/* ─── Admin module registry ─────────────────────────────────────────────────
 * Single source of truth for the ops-console navigation. The shell renders it
 * twice (desktop rail + mobile drawer) and uses `id` to pick the module
 * component; nothing else may hardcode module ids.
 * ────────────────────────────────────────────────────────────────────────── */

export type AdminModuleId =
  | 'analytics'
  | 'verifications'
  | 'providers'
  | 'bookings'
  | 'disputes'
  | 'reviews'
  | 'categories'
  | 'crm'
  | 'incidents';

export interface AdminModule {
  id:    AdminModuleId;
  label: string;
  icon:  ElementType;
}

export const MODULES: AdminModule[] = [
  { id: 'analytics',     label: 'Analytics',          icon: BarChart3 },
  { id: 'verifications', label: 'Verification Queue', icon: FileText },
  { id: 'providers',     label: 'Provider Queue',     icon: ShieldCheck },
  { id: 'bookings',      label: 'Booking Console',    icon: Briefcase },
  { id: 'disputes',      label: 'Refund & Disputes',  icon: DollarSign },
  { id: 'reviews',       label: 'Review Moderation',  icon: Star },
  { id: 'categories',    label: 'Category Config',    icon: Settings },
  { id: 'crm',           label: 'CRM / Referrals',    icon: Users },
  { id: 'incidents',     label: 'Incident Log',       icon: FileWarning },
];
