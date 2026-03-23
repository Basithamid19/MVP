import React from 'react';
import { cn } from '@/lib/utils';

/* ─── Card ──────────────────────────────────────────────────────────────────
 * Base surface component. Compose with CardHeader, CardBody, CardFooter
 * or use raw children with a padding prop.
 *
 * Usage:
 *   <Card hover padding="md">...</Card>
 *   <Card radius="panel" padding="lg" className="lg:col-span-2">...</Card>
 * ────────────────────────────────────────────────────────────────────────── */

const PADDING = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6',
  xl:   'p-8',
} as const;

const RADIUS = {
  card:  'rounded-card',
  panel: 'rounded-panel',
  hero:  'rounded-hero',
} as const;

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?:   boolean;
  padding?: keyof typeof PADDING;
  radius?:  keyof typeof RADIUS;
  bordered?: boolean;
}

export function Card({
  hover,
  padding = 'md',
  radius  = 'card',
  bordered = true,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-white',
        bordered && 'border border-border-dim',
        RADIUS[radius],
        PADDING[padding],
        'shadow-card',
        hover && [
          'transition-all duration-150 cursor-pointer',
          'hover:border-border hover:shadow-elevated hover:-translate-y-0.5',
        ],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ─── Compound parts ────────────────────────────────────────────────────────
 * Optional structured sub-components for consistent internal layout.
 * ────────────────────────────────────────────────────────────────────────── */

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-start justify-between pb-4 mb-4 border-b border-border-dim',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('font-bold text-base text-ink tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-between pt-4 mt-4 border-t border-border-dim',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
