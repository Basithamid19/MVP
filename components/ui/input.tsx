import React from 'react';
import { cn } from '@/lib/utils';

/* ─── Input ─────────────────────────────────────────────────────────────────
 * Premium form field with optional label, leading/trailing icons, and
 * inline error + hint messaging.
 *
 * Usage:
 *   <Input label="Email Address" type="email" placeholder="name@example.com" />
 *   <Input label="Search" leading={<Search className="w-4 h-4" />} />
 *   <Input error="This field is required" />
 * ────────────────────────────────────────────────────────────────────────── */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelNote?: string;
  error?: string;
  hint?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  wrapperClassName?: string;
}

export function Input({
  label,
  labelNote,
  error,
  hint,
  leading,
  trailing,
  className,
  wrapperClassName,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={cn('space-y-1.5', wrapperClassName)}>
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={inputId}
            className="text-xs font-bold uppercase tracking-widest text-ink-dim"
          >
            {label}
          </label>
          {labelNote && (
            <span className="text-xs text-ink-dim font-medium">{labelNote}</span>
          )}
        </div>
      )}

      <div className="relative">
        {leading && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-dim pointer-events-none">
            {leading}
          </div>
        )}

        <input
          id={inputId}
          className={cn(
            /* Base */
            'w-full py-3 text-sm text-ink bg-surface-alt',
            'border rounded-input',
            'placeholder:text-ink-dim',
            'transition-all duration-150',
            'outline-none',
            /* Focus */
            'focus:ring-2 focus:ring-brand/20 focus:border-brand',
            /* State */
            error
              ? 'border-danger focus:ring-danger/20 focus:border-danger'
              : 'border-border hover:border-border-dim',
            /* Padding — account for icons */
            leading  ? 'pl-10' : 'pl-4',
            trailing ? 'pr-10' : 'pr-4',
            className
          )}
          {...props}
        />

        {trailing && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-dim">
            {trailing}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-danger font-medium flex items-center gap-1">
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-ink-dim leading-relaxed">{hint}</p>
      )}
    </div>
  );
}

/* ─── Textarea ──────────────────────────────────────────────────────────────
 * Matches Input's visual system for multi-line fields.
 * ────────────────────────────────────────────────────────────────────────── */

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  labelNote?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

export function Textarea({
  label,
  labelNote,
  error,
  hint,
  className,
  wrapperClassName,
  id,
  ...props
}: TextareaProps) {
  const fieldId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={cn('space-y-1.5', wrapperClassName)}>
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={fieldId}
            className="text-xs font-bold uppercase tracking-widest text-ink-dim"
          >
            {label}
          </label>
          {labelNote && (
            <span className="text-xs text-ink-dim font-medium">{labelNote}</span>
          )}
        </div>
      )}

      <textarea
        id={fieldId}
        className={cn(
          'w-full px-4 py-3 text-sm text-ink bg-surface-alt',
          'border rounded-input resize-y',
          'placeholder:text-ink-dim',
          'transition-all duration-150',
          'outline-none',
          'focus:ring-2 focus:ring-brand/20 focus:border-brand',
          error
            ? 'border-danger focus:ring-danger/20 focus:border-danger'
            : 'border-border hover:border-border-dim',
          className
        )}
        {...props}
      />

      {error && (
        <p className="text-xs text-danger font-medium">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-ink-dim leading-relaxed">{hint}</p>
      )}
    </div>
  );
}

/* ─── Select ────────────────────────────────────────────────────────────────
 * Styled <select> that matches Input/Textarea appearance.
 * ────────────────────────────────────────────────────────────────────────── */

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

export function Select({
  label,
  error,
  hint,
  className,
  wrapperClassName,
  id,
  children,
  ...props
}: SelectProps) {
  const fieldId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={cn('space-y-1.5', wrapperClassName)}>
      {label && (
        <label
          htmlFor={fieldId}
          className="text-xs font-bold uppercase tracking-widest text-ink-dim"
        >
          {label}
        </label>
      )}

      <select
        id={fieldId}
        className={cn(
          'w-full px-4 py-3 text-sm text-ink bg-surface-alt',
          'border rounded-input',
          'appearance-none',
          'transition-all duration-150',
          'outline-none',
          'focus:ring-2 focus:ring-brand/20 focus:border-brand',
          error
            ? 'border-danger'
            : 'border-border hover:border-border-dim',
          className
        )}
        {...props}
      >
        {children}
      </select>

      {error && <p className="text-xs text-danger font-medium">{error}</p>}
      {hint && !error && <p className="text-xs text-ink-dim">{hint}</p>}
    </div>
  );
}
