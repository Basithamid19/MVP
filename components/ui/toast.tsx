'use client';

import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Toast ─────────────────────────────────────────────────────────────────
 * THE feedback layer — replaces every native alert() in the app.
 * Self-contained: context + portal, no dependency beyond lucide icons.
 *
 * Setup (already wired in app/layout.tsx, innermost provider):
 *   <ToastProvider>{children}</ToastProvider>
 *
 * Usage in any client component:
 *   const { toast } = useToast();
 *   toast.success('Quote sent');
 *   toast.error('Could not save changes');
 *   toast('Deposit received', { variant: 'info', duration: 6000 });
 *
 * Behavior: bottom-center on mobile / bottom-right at sm+, auto-dismiss after
 * 4s, hover pauses the timer, click dismisses, stack capped at 3 (oldest
 * drops out). The region is aria-live="polite" so screen readers announce it.
 * ────────────────────────────────────────────────────────────────────────── */

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastOptions {
  variant?:  ToastVariant;
  /** Milliseconds before auto-dismiss. Defaults to 4000. */
  duration?: number;
}

interface ToastItem {
  id:       number;
  message:  string;
  variant:  ToastVariant;
  duration: number;
}

/** Callable toast fn with `.success` / `.error` / `.info` conveniences. */
export interface ToastFn {
  (message: string, opts?: ToastOptions): void;
  success: (message: string, opts?: Omit<ToastOptions, 'variant'>) => void;
  error:   (message: string, opts?: Omit<ToastOptions, 'variant'>) => void;
  info:    (message: string, opts?: Omit<ToastOptions, 'variant'>) => void;
}

const MAX_STACK       = 3;
const DEFAULT_DURATION = 4000;

const VARIANT_ICON: Record<ToastVariant, { Icon: React.ElementType; className: string }> = {
  success: { Icon: CheckCircle2, className: 'text-trust-edge' },
  error:   { Icon: AlertCircle,  className: 'text-danger-edge' },
  info:    { Icon: Info,         className: 'text-info-edge' },
};

const ToastContext = createContext<{ toast: ToastFn } | null>(null);

/** Access the toast dispatcher. Must be used under <ToastProvider>. */
export function useToast(): { toast: ToastFn } {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems]   = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const nextId = useRef(0);

  useEffect(() => setMounted(true), []);

  const dismiss = useCallback((id: number) => {
    setItems(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useMemo<ToastFn>(() => {
    const push = (message: string, opts?: ToastOptions) => {
      const item: ToastItem = {
        id:       nextId.current++,
        message,
        variant:  opts?.variant  ?? 'info',
        duration: opts?.duration ?? DEFAULT_DURATION,
      };
      // Cap the stack — oldest falls off the top.
      setItems(prev => [...prev, item].slice(-MAX_STACK));
    };

    return Object.assign(push, {
      success: (m: string, o?: Omit<ToastOptions, 'variant'>) => push(m, { ...o, variant: 'success' }),
      error:   (m: string, o?: Omit<ToastOptions, 'variant'>) => push(m, { ...o, variant: 'error' }),
      info:    (m: string, o?: Omit<ToastOptions, 'variant'>) => push(m, { ...o, variant: 'info' }),
    }) as ToastFn;
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  const stack = (
    <div
      aria-live="polite"
      className={cn(
        'fixed z-[70] pointer-events-none flex flex-col items-center gap-2',
        'bottom-24 left-4 right-4',
        'sm:bottom-6 sm:left-auto sm:right-6 sm:items-end sm:w-auto sm:max-w-sm'
      )}
    >
      {items.map(item => (
        <ToastRow key={item.id} item={item} onDismiss={dismiss} />
      ))}
    </div>
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted ? createPortal(stack, document.body) : null}
    </ToastContext.Provider>
  );
}

/* ─── ToastRow ──────────────────────────────────────────────────────────────
 * Owns its own dismiss timer so hover-pause doesn't re-render the stack.
 * ────────────────────────────────────────────────────────────────────────── */

function ToastRow({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: number) => void;
}) {
  const [shown, setShown]     = useState(false);
  const [paused, setPaused]   = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Enter transition — flip to the visible state on the frame after mount.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const close = useCallback(() => {
    setLeaving(true);
    // Let the exit transition play before the node is unmounted.
    window.setTimeout(() => onDismiss(item.id), 250);
  }, [item.id, onDismiss]);

  useEffect(() => {
    if (paused || leaving) return;
    const timer = window.setTimeout(close, item.duration);
    return () => window.clearTimeout(timer);
  }, [paused, leaving, item.duration, close]);

  const { Icon, className: iconClass } = VARIANT_ICON[item.variant];

  return (
    <button
      type="button"
      onClick={close}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={cn(
        'pointer-events-auto w-full sm:w-auto text-left',
        'flex items-center gap-2.5 rounded-card bg-ink text-white shadow-float',
        'px-4 py-3 text-sm font-medium',
        'transition-all duration-250 [transition-timing-function:var(--ease-out-quart)]',
        shown && !leaving
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-2'
      )}
    >
      <Icon className={cn('w-4 h-4 shrink-0', iconClass)} aria-hidden="true" />
      <span className="min-w-0">{item.message}</span>
    </button>
  );
}
