import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/*
 * buttonVariants — exported so Link components can apply the same styling
 * without needing an asChild prop or Radix dependency.
 *
 * Usage with Link:
 *   <Link href="..." className={buttonVariants({ variant: 'primary', size: 'lg' })}>
 *     Book a Pro
 *   </Link>
 *
 * Usage as button:
 *   <Button variant="secondary" size="md">Cancel</Button>
 */
export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center font-semibold',
    'transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:pointer-events-none',
    'select-none whitespace-nowrap shrink-0',
  ].join(' '),
  {
    variants: {
      variant: {
        /* ── Primary — deep botanical green, the main brand action ── */
        primary: [
          'bg-brand text-white',
          'hover:bg-brand-dark active:scale-[0.98]',
          'shadow-sm',
        ].join(' '),

        /* ── Secondary — warm neutral surface ──────────────────── */
        secondary: [
          'bg-surface-alt text-ink border border-border',
          'hover:bg-canvas hover:border-border-dim',
          'shadow-sm',
        ].join(' '),

        /* ── Ghost — no background ──────────────────────────────── */
        ghost: [
          'text-ink-sub',
          'hover:text-ink hover:bg-surface-alt',
        ].join(' '),

        /* ── Outline — brand-color border ──────────────────────── */
        outline: [
          'border-2 border-brand text-brand bg-transparent',
          'hover:bg-brand hover:text-white',
        ].join(' '),

        /* ── Danger ─────────────────────────────────────────────── */
        danger: [
          'bg-danger-surface text-danger border border-danger-edge',
          'hover:bg-red-100',
        ].join(' '),

        /* ── Muted — for less important secondary actions ─────── */
        muted: [
          'bg-surface-alt text-ink-dim border border-border-dim',
          'hover:text-ink hover:border-border',
        ].join(' '),

        /* ── Trust — semantic positive action (separate from brand) */
        trust: [
          'bg-trust-surface text-trust border border-trust-edge',
          'hover:bg-green-100',
        ].join(' '),
      },

      size: {
        xs: 'px-2.5 py-1   text-[11px] gap-1   rounded-chip',
        sm: 'px-3   py-1.5 text-xs     gap-1.5  rounded-input',
        md: 'px-4   py-2.5 text-sm     gap-2    rounded-input',
        lg: 'px-5   py-3   text-sm     gap-2    rounded-card  font-bold',
        xl: 'px-7   py-3.5 text-base   gap-2.5  rounded-card  font-bold',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
