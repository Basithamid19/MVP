'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Modal ─────────────────────────────────────────────────────────────────
 * ONE overlay primitive with two presentations, responsive by default:
 *   < sm  → bottom sheet (drag-handle bar, slides up from the edge)
 *   ≥ sm  → centered dialog (scales + fades in)
 *
 * Portals to <body> so a page header's backdrop-blur / transform ancestor
 * can't trap the fixed positioning — same pattern as CustomerMenuDrawer.
 * Closes on backdrop click and Escape; locks body scroll while open.
 *
 * Usage:
 *   <Modal open={open} onClose={() => setOpen(false)} title="Filters" size="md"
 *     footer={
 *       <ModalFooter>
 *         <Button variant="ghost" onClick={close}>Cancel</Button>
 *         <Button onClick={apply}>Apply</Button>
 *       </ModalFooter>
 *     }
 *   >
 *     …body…
 *   </Modal>
 * ────────────────────────────────────────────────────────────────────────── */

const SIZES = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
} as const;

export interface ModalProps {
  open:         boolean;
  onClose:      () => void;
  title?:       React.ReactNode;
  description?: React.ReactNode;
  footer?:      React.ReactNode;
  size?:        keyof typeof SIZES;
  className?:   string;
  children?:    React.ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  size = 'md',
  className,
  children,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const [shown, setShown]     = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId  = useId();

  useEffect(() => setMounted(true), []);

  // Escape to close + body scroll lock while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  // Drive the enter/exit transition, and move focus into the panel on open.
  useEffect(() => {
    if (!open) { setShown(false); return; }
    const raf = requestAnimationFrame(() => {
      setShown(true);
      panelRef.current?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [open]);

  if (!mounted || !open) return null;

  const overlay = (
    <div className="fixed inset-0 z-[65] flex items-end sm:items-center sm:justify-center">
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={cn(
          'absolute inset-0 bg-ink/40 backdrop-blur-[2px]',
          'transition-opacity duration-250 ease-out',
          shown ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Panel — bottom sheet < sm, centered dialog ≥ sm */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          'relative w-full bg-card shadow-float outline-none',
          'rounded-t-panel sm:rounded-panel',
          'max-h-[90vh] sm:max-h-[85vh] flex flex-col',
          'sm:w-full sm:mx-4',
          SIZES[size],
          'transition-all duration-250 [transition-timing-function:var(--ease-out-quart)]',
          shown
            ? 'translate-y-0 opacity-100 sm:scale-100'
            : 'translate-y-6 opacity-0 sm:translate-y-0 sm:scale-95',
          className
        )}
      >
        {/* Drag handle — sheet affordance, mobile only */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <span className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-4 sm:pt-6 shrink-0">
            <div className="min-w-0">
              {title && (
                <h2 id={titleId} className="text-lg font-bold tracking-tight text-ink">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-sm text-ink-sub mt-1 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 shrink-0 -mr-1.5 -mt-1 flex items-center justify-center rounded-full text-ink-dim hover:text-ink hover:bg-surface-alt transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0 shrink-0">{footer}</div>
        )}
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

/* ─── ModalFooter ───────────────────────────────────────────────────────────
 * Standard action row — pass into <Modal footer={…}>.
 * ────────────────────────────────────────────────────────────────────────── */

export function ModalFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex gap-3 justify-end pt-4 border-t border-border-dim',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
