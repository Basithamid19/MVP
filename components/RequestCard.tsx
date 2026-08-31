'use client';

import React from 'react';
import Link from 'next/link';
import { CalendarDays, Wallet } from 'lucide-react';
import { StatusBadge, buttonVariants } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useLocale, useTranslation } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/types';

/* ─── RequestCard ────────────────────────────────────────────────────────────
 * The job a conversation is about, pinned at the top of the thread.
 *
 * A DIRECT request opens its thread at request time — before any quote exists —
 * so for a while this card is the ONLY content the conversation has. Without it
 * both sides landed on "No messages yet" plus a structured-composer notice
 * pointing at an offer that wasn't there: a dead end. With it the provider gets
 * the brief and a "Send your quote" CTA, and the customer sees what they're
 * waiting on.
 *
 * Once a negotiation exists the card stays as context and drops its CTA — the
 * offer card in the stream owns the actions from that point on.
 *
 * Shape mirrors the `request` field of GET /api/chat (both the detail response
 * and each list row); see the contract comment in app/api/chat/route.ts.
 * ────────────────────────────────────────────────────────────────────────── */

export interface ThreadRequest {
  id: string;
  description: string | null;
  budget: number | null;
  /** ISO string over the wire (Prisma DateTime serialized by NextResponse). */
  dateWindow: string | null;
  isUrgent: boolean;
  status: string;
  categoryName: string | null;
}

/** Statuses where a provider can still put a quote on the table. */
const OPEN_STATUSES = ['NEW', 'QUOTED'];

/** Narrow an unknown API field to a ThreadRequest, or null. */
export function asThreadRequest(value: unknown): ThreadRequest | null {
  const r = value as ThreadRequest | null;
  if (!r || typeof r !== 'object' || typeof r.id !== 'string' || !r.id) return null;
  return {
    id: r.id,
    description: r.description ?? null,
    budget: typeof r.budget === 'number' ? r.budget : null,
    dateWindow: r.dateWindow ?? null,
    isUrgent: !!r.isUrgent,
    status: typeof r.status === 'string' ? r.status : '',
    categoryName: r.categoryName ?? null,
  };
}

const intlLocale = (locale: Locale) => (locale === 'lt' ? 'lt-LT' : 'en-GB');

export interface RequestCardProps {
  request: ThreadRequest;
  /** Provider viewer gets the CTA; customer gets the waiting line. */
  viewerIsProvider: boolean;
  /** The counterpart's display name, for the customer's waiting line. */
  otherName: string;
  /**
   * True once a quote exists for this thread. The offer card in the stream owns
   * the actions from then on, and POST /api/quotes allows only one quote per
   * provider per request — so the "Send your quote" CTA retires for good.
   */
  offerOnTable: boolean;
  className?: string;
}

export function RequestCard({
  request,
  viewerIsProvider,
  otherName,
  offerOnTable,
  className,
}: RequestCardProps) {
  const t = useTranslation();
  const s = t.negotiation;
  const { locale } = useLocale();

  const showCta = !offerOnTable && OPEN_STATUSES.includes(request.status);

  const preferredDate = request.dateWindow
    ? new Date(request.dateWindow).toLocaleDateString(intlLocale(locale), {
        day: 'numeric',
        month: 'short',
      })
    : null;

  return (
    <div className={cn('bg-card border border-border rounded-card px-4 py-3.5', className)}>
      {/* Eyebrow — what kind of job, and whether it's urgent */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-2xs font-bold uppercase tracking-widest text-ink-dim">
          {s.requestLabel}
        </span>
        {request.categoryName && (
          <StatusBadge variant="brand" label={request.categoryName} />
        )}
        {request.isUrgent && <StatusBadge variant="warning" label={s.requestUrgent} />}
      </div>

      {request.description && (
        <p className="mt-2 text-sm text-ink leading-relaxed line-clamp-3 break-words whitespace-pre-wrap">
          {request.description}
        </p>
      )}

      {/* Quiet meta — the two numbers a pro prices against */}
      {(request.budget != null || preferredDate) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          {request.budget != null && (
            <span className="inline-flex items-center gap-1.5 text-3xs text-ink-sub">
              <Wallet className="w-3 h-3 shrink-0" aria-hidden="true" />
              <span className="font-semibold text-ink">{`€${request.budget.toFixed(0)}`}</span>
              {s.requestBudget}
            </span>
          )}
          {preferredDate && (
            <span className="inline-flex items-center gap-1.5 text-3xs text-ink-sub">
              <CalendarDays className="w-3 h-3 shrink-0" aria-hidden="true" />
              <span className="font-semibold text-ink">{preferredDate}</span>
              {s.requestPreferredDate}
            </span>
          )}
        </div>
      )}

      {/* Next step — only while the request is open and unquoted */}
      {showCta && (
        <div className="mt-3 pt-3 border-t border-border-dim">
          {viewerIsProvider ? (
            <Link
              href={`/provider/quote/${request.id}`}
              className={buttonVariants({ variant: 'primary', size: 'sm' })}
            >
              {s.sendYourQuote}
            </Link>
          ) : (
            <p className="text-3xs italic text-ink-dim">
              {`${s.awaitQuotePrefix} ${otherName} ${s.awaitQuoteSuffix}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default RequestCard;
