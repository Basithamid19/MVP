import React from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui';
import { cn } from '@/lib/utils';

/* ─── Marketing section kit ─────────────────────────────────────────────────
 * The three blocks that /about and /for-pros had copy-pasted between them.
 * Extracted so the two pages cannot drift again (they already had: identical
 * stat bands with different labels for the same number, and value/benefit
 * cards whose title and body were both text-sm — no size split at all).
 * ────────────────────────────────────────────────────────────────────────── */

/* ── StatsBand ───────────────────────────────────────────────────────────── */

export interface Stat {
  value: string;
  label: string;
}

export function StatsBand({ stats }: { stats: Stat[] }) {
  return (
    <section className="py-10 sm:py-14 bg-card border-y border-border-dim">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center">
          {stats.map(({ value, label }) => (
            <div key={label} className="min-w-0">
              <p className="text-2xl sm:text-3xl font-bold text-brand">{value}</p>
              <p className="text-xs sm:text-sm text-ink-sub mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── ValueCard ───────────────────────────────────────────────────────────── */

export interface ValueCardProps {
  icon:     LucideIcon;
  title:    string;
  desc:     string;
  /** Surface the card sits on top of — pick the one the section is NOT using. */
  surface?: 'card' | 'canvas';
}

export function ValueCard({ icon: Icon, title, desc, surface = 'card' }: ValueCardProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-border-dim p-5 sm:p-6',
        surface === 'canvas' ? 'bg-canvas' : 'bg-card',
      )}
    >
      <div className="w-10 h-10 bg-brand-muted rounded-input flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-brand" strokeWidth={1.5} />
      </div>
      {/* Title carries the weight; body steps down. */}
      <p className="font-bold text-base text-ink mb-1.5">{title}</p>
      <p className="text-sm text-ink-sub leading-relaxed">{desc}</p>
    </div>
  );
}

/* ── CtaCard ─────────────────────────────────────────────────────────────── */

export interface CtaCardProps {
  title:          string;
  desc:           string;
  cta:            string;
  href:           string;
  secondaryCta?:  string;
  secondaryHref?: string;
  note?:          string;
}

export function CtaCard({
  title, desc, cta, href, secondaryCta, secondaryHref, note,
}: CtaCardProps) {
  return (
    <section className="py-16 sm:py-24 bg-card">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        <div className="bg-canvas rounded-card border border-border-dim shadow-elevated px-6 py-10 sm:px-10 sm:py-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink mb-3">{title}</h2>
          <p className="text-ink-sub text-sm sm:text-base leading-relaxed mb-8 max-w-sm mx-auto">
            {desc}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href={href} className={buttonVariants({ variant: 'primary', size: 'lg' })}>
              {cta} <ArrowRight className="w-4 h-4" />
            </Link>
            {secondaryCta && secondaryHref && (
              <Link href={secondaryHref} className={buttonVariants({ variant: 'secondary', size: 'lg' })}>
                {secondaryCta}
              </Link>
            )}
          </div>
          {note && <p className="text-xs text-ink-dim mt-4">{note}</p>}
        </div>
      </div>
    </section>
  );
}

/* ── MarketingSectionHeader ──────────────────────────────────────────────── */

export function MarketingSectionHeader({
  eyebrow, title, align = 'center',
}: { eyebrow: string; title: string; align?: 'center' | 'left' }) {
  return (
    <div className={cn('mb-12 sm:mb-16', align === 'center' && 'text-center')}>
      <p className="text-2xs font-bold text-brand uppercase tracking-[0.15em] mb-3">{eyebrow}</p>
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">{title}</h2>
    </div>
  );
}

/* ─── Legal document kit ────────────────────────────────────────────────────
 * /terms and /privacy previously stored their copy as `whitespace-pre-line`
 * string blobs, which flattened every subhead and bullet run into undifferen-
 * tiated body text. The copy is now structured data (below) rendered with real
 * headings and real <ul>s. Shared here so the two pages render identically.
 * ────────────────────────────────────────────────────────────────────────── */

export type LegalBlock =
  | { type: 'p';       text:  string }
  | { type: 'h3';      text:  string }
  | { type: 'ul';      items: string[] }
  /* Postal blocks: line breaks are meaningful, so they are not paragraphs. */
  | { type: 'address'; lines: string[] };

export interface LegalSection {
  id:     string;
  title:  string;
  blocks: LegalBlock[];
}

export function LegalDoc({ sections, tocLabel = 'On this page' }: { sections: LegalSection[]; tocLabel?: string }) {
  return (
    <section className="py-12 sm:py-16 bg-card">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:flex lg:items-start lg:gap-12">

        {/* Content column */}
        <div className="min-w-0 flex-1 lg:max-w-2xl space-y-10">
          {sections.map(({ id, title, blocks }) => (
            <section key={id} id={id} className="scroll-mt-24">
              <h2 className="text-lg font-bold text-ink mb-3">{title}</h2>
              <div className="space-y-4">
                {blocks.map((block, i) => {
                  if (block.type === 'h3') {
                    return (
                      <h3 key={i} className="text-base font-semibold text-ink pt-2">
                        {block.text}
                      </h3>
                    );
                  }
                  if (block.type === 'ul') {
                    return (
                      <ul key={i} className="list-disc pl-5 space-y-1.5 text-base text-ink-sub leading-relaxed">
                        {block.items.map(item => <li key={item}>{item}</li>)}
                      </ul>
                    );
                  }
                  if (block.type === 'address') {
                    return (
                      <address key={i} className="not-italic text-base text-ink-sub leading-relaxed">
                        {block.lines.map(line => <span key={line} className="block">{line}</span>)}
                      </address>
                    );
                  }
                  return (
                    <p key={i} className="text-base text-ink-sub leading-relaxed">
                      {block.text}
                    </p>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Mini-TOC — desktop only; the doc is short enough to scroll on mobile */}
        <nav aria-label={tocLabel} className="hidden lg:block w-56 shrink-0 sticky top-24">
          <p className="text-2xs font-bold uppercase tracking-widest text-ink-dim mb-3">
            {tocLabel}
          </p>
          <ul className="space-y-2.5">
            {sections.map(({ id, title }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="text-sm text-ink-sub hover:text-ink transition-colors duration-150"
                >
                  {title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

      </div>
    </section>
  );
}
