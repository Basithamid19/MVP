import React from 'react';
import { Info, Clock, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Alert ─────────────────────────────────────────────────────────────────
 * THE quiet notice. Replaces the hand-rolled full-width tinted slab banners
 * that used to shout over page content. Compact, icon-led, optional action.
 *
 * Usage:
 *   <Alert variant="caution">{t.quoteInbox.dayUnavailable}</Alert>
 *   <Alert variant="danger" title={t.x.title} action={<Button …/>}>…</Alert>
 *   <Alert variant="info" onDismiss={() => setShow(false)}>…</Alert>
 * ────────────────────────────────────────────────────────────────────────── */

export type AlertVariant = 'info' | 'caution' | 'danger' | 'trust';

const VARIANTS: Record<AlertVariant, { wrap: string; icon: string; Icon: React.ElementType }> = {
  info:    { wrap: 'bg-info-surface border-info-edge',       icon: 'text-info',    Icon: Info },
  caution: { wrap: 'bg-caution-surface border-caution-edge', icon: 'text-caution', Icon: Clock },
  danger:  { wrap: 'bg-danger-surface border-danger-edge',   icon: 'text-danger',  Icon: AlertCircle },
  trust:   { wrap: 'bg-trust-surface border-trust-edge',     icon: 'text-trust',   Icon: CheckCircle2 },
};

export interface AlertProps {
  variant?:   AlertVariant;
  /** Override the default variant icon. Pass null to hide it. */
  icon?:      React.ElementType | null;
  title?:     React.ReactNode;
  action?:    React.ReactNode;
  onDismiss?: () => void;
  className?: string;
  children?:  React.ReactNode;
}

export function Alert({
  variant = 'info',
  icon,
  title,
  action,
  onDismiss,
  className,
  children,
}: AlertProps) {
  const v = VARIANTS[variant];
  const Icon = icon === null ? null : (icon ?? v.Icon);

  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-3 p-3.5 rounded-card border',
        v.wrap,
        className,
      )}
    >
      {Icon && <Icon className={cn('w-4 h-4 shrink-0 mt-0.5', v.icon)} aria-hidden="true" />}
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-bold text-ink">{title}</p>}
        {children && (
          <div className={cn('text-sm text-ink-sub leading-relaxed', title && 'mt-0.5')}>
            {children}
          </div>
        )}
        {action && <div className="mt-2.5">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className={cn('shrink-0 p-1 -m-1 rounded-full hover:bg-card/60 transition-colors', v.icon)}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
