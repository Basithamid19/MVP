'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/* ─── WizardStepper ─────────────────────────────────────────────────────────
 * The single stepper for every multi-step flow (request wizard, provider
 * onboarding). Connectors are derived from `steps.length` — never hardcode
 * a count.
 *
 * Desktop (≥sm): numbered dots + labels.
 *   done     → bg-brand text-white + Check
 *   current  → bg-brand text-white ring-4 ring-brand/15
 *   upcoming → bg-surface-alt text-ink-dim border border-border
 *
 * Mobile (<sm): a labeled progress line — "Step 3 of 5 · Details" — instead
 * of bare dots, which were unreadable at that size.
 *
 * Usage:
 *   <WizardStepper steps={[{ key: 'service', label: 'Service' }, …]} current={step} />
 * ────────────────────────────────────────────────────────────────────────── */

export interface WizardStep {
  /** Stable identity for the React key — not rendered. */
  key: string;
  /** Translated, user-visible step name. */
  label: string;
}

export interface WizardStepperProps {
  steps: WizardStep[];
  /** 1-based index of the active step. Values past the end mark all steps done. */
  current: number;
  className?: string;
}

const MOTION = 'transition-all duration-250 [transition-timing-function:var(--ease-out-quart)]';

export function WizardStepper({ steps, current, className }: WizardStepperProps) {
  const t = useTranslation();
  const total = steps.length;
  if (!total) return null;

  // A flow that has run past its last step (e.g. onboarding's success screen)
  // still needs a sane label, so clamp for display only.
  const active = Math.min(Math.max(current, 1), total);
  const activeLabel = steps[active - 1]?.label;
  const progressLabel = `${t.wizard.stepLabel} ${active} ${t.wizard.stepOf} ${total}`;

  return (
    <div className={cn('flex-1 min-w-0', className)}>

      {/* ── Mobile: labeled progress line ── */}
      <div className="sm:hidden">
        <p className="text-2xs font-bold uppercase tracking-widest text-ink-dim truncate">
          {progressLabel}
          {activeLabel && <span className="text-ink"> · {activeLabel}</span>}
        </p>
        <div
          role="progressbar"
          aria-label={progressLabel}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={active}
          className="mt-1.5 h-1 w-full rounded-chip bg-surface-alt overflow-hidden"
        >
          <div
            className={cn('h-full rounded-chip bg-brand', MOTION)}
            style={{ width: `${(active / total) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Desktop: numbered dots + labels ── */}
      <ol className="hidden sm:flex items-center gap-1.5 min-w-0">
        {steps.map((s, i) => {
          const done      = i + 1 < current;
          const isCurrent = i + 1 === current;
          const isLast    = i === total - 1;
          return (
            <li key={s.key} className={cn('flex items-center gap-1.5 min-w-0', !isLast && 'flex-1')}>
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  aria-current={isCurrent ? 'step' : undefined}
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-2xs font-bold',
                    MOTION,
                    isCurrent
                      ? 'bg-brand text-white ring-4 ring-brand/15'
                      : done
                      ? 'bg-brand text-white'
                      : 'bg-surface-alt text-ink-dim border border-border'
                  )}
                >
                  {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : i + 1}
                </span>
                <span className={cn('text-xs font-bold truncate', isCurrent ? 'text-ink' : 'text-ink-dim')}>
                  {s.label}
                </span>
              </div>
              {!isLast && (
                <span className={cn('flex-1 min-w-3 h-px transition-colors', done ? 'bg-brand' : 'bg-border')} />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default WizardStepper;
