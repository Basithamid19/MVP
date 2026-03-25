/* ─── Dispatch Shared UI Primitives ───────────────────────────────────────
 * Import from this barrel for clean, tree-shakeable usage:
 *   import { Button, buttonVariants, Card, StatusBadge } from '@/components/ui';
 * ────────────────────────────────────────────────────────────────────────── */

export { Button, buttonVariants }              from './button';
export type { ButtonProps }                    from './button';

export { Input, Textarea, Select }             from './input';
export type { InputProps, TextareaProps, SelectProps } from './input';

export {
  Card, CardHeader, CardTitle, CardBody, CardFooter,
}                                              from './card';
export type { CardProps }                      from './card';

export { StatCard }                            from './stat-card';
export type { StatCardProps }                  from './stat-card';

export { StatusBadge, bookingStatusVariant, requestStatusVariant, verificationTierVariant }
                                               from './status-badge';
export type { BadgeVariant, StatusBadgeProps } from './status-badge';

export { EmptyState }                          from './empty-state';
export type { EmptyStateProps }                from './empty-state';

export { PageHeader, SectionHeader }           from './page-header';
export type { PageHeaderProps, SectionHeaderProps } from './page-header';
