'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ShieldCheck, Clock, CheckCircle2, XCircle, FileText,
  ArrowRight, Check, CreditCard, Camera, Award,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import {
  PageHeader, Card, StatusBadge, verificationTierVariant,
  EmptyState, Skeleton, buttonVariants,
} from '@/components/ui';
import type { BadgeVariant } from '@/components/ui';
import { cn } from '@/lib/utils';

interface VerificationDoc {
  id: string;
  docType: string;
  docUrl: string;
  status: string;
  rejectionReason?: string | null;
  createdAt: string;
}

// The tier ladder, in order — drives the progress rail in the hero.
const TIER_ORDER = ['TIER0_BASIC', 'TIER1_ID_VERIFIED', 'TIER2_TRADE_VERIFIED', 'TIER3_ENHANCED'] as const;

// Distinct mark per document type — five identical file icons read cheap.
const DOC_ICONS: Record<string, React.ElementType> = {
  ID: CreditCard,
  SELFIE: Camera,
  INSURANCE: ShieldCheck,
  CERTIFICATE: Award,
};

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};

export default function VerificationStatusPage() {
  const t = useTranslation();
  const { status: authStatus } = useSession();
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState('TIER0_BASIC');
  const [documents, setDocuments] = useState<VerificationDoc[]>([]);

  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    fetch('/api/provider/verification')
      .then(r => r.json())
      .then(data => {
        setTier(data.verificationTier ?? 'TIER0_BASIC');
        setDocuments(data.documents ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authStatus]);

  if (authStatus === 'loading' || loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton rounded="chip" className="h-8 w-56" />
        <Skeleton rounded="panel" className="h-44 w-full" />
        <Skeleton rounded="card" className="h-16 w-full" />
        <Skeleton rounded="card" className="h-16 w-full" />
        <Skeleton rounded="card" className="h-16 w-full" />
      </div>
    );
  }

  const STATUS_LABELS: Record<string, string> = {
    PENDING: t.verificationPage.stUnderReview,
    APPROVED: t.verificationPage.stApproved,
    REJECTED: t.verificationPage.stRejected,
  };

  const DOC_TYPE_LABELS: Record<string, string> = {
    ID: t.verificationPage.docId,
    CERTIFICATE: t.verificationPage.docCertificate,
    INSURANCE: t.verificationPage.docInsurance,
    SELFIE: t.verificationPage.docSelfie,
  };

  const TIER_LABELS: Record<string, { label: string; desc: string }> = {
    TIER0_BASIC:          { label: t.verificationPage.tierBasic,         desc: t.verificationPage.tierBasicDesc },
    TIER1_ID_VERIFIED:    { label: t.verificationPage.tierIdVerified,    desc: t.verificationPage.tierIdVerifiedDesc },
    TIER2_TRADE_VERIFIED: { label: t.verificationPage.tierTradeVerified, desc: t.verificationPage.tierTradeVerifiedDesc },
    TIER3_ENHANCED:       { label: t.verificationPage.tierEnhanced,      desc: t.verificationPage.tierEnhancedDesc },
  };

  const tierIdx = Math.max(TIER_ORDER.indexOf(tier as (typeof TIER_ORDER)[number]), 0);
  const tierInfo = TIER_LABELS[tier] ?? TIER_LABELS.TIER0_BASIC;
  const pendingCount = documents.filter(d => d.status === 'PENDING').length;
  const approvedCount = documents.filter(d => d.status === 'APPROVED').length;
  const rejectedCount = documents.filter(d => d.status === 'REJECTED').length;

  // The single "what happens next" line for the hero footer — replaces the
  // full-width banner slabs the page used to stack at the bottom.
  const nextStep = rejectedCount > 0
    ? {
        Icon: XCircle,
        tone: 'text-danger',
        title: t.verificationPage.rejectedTitle,
        desc: t.verificationPage.rejectedDesc,
        action: (
          <Link
            href="/provider/onboarding"
            className={cn(buttonVariants({ variant: 'danger', size: 'sm' }), 'mt-2.5')}
          >
            {t.verificationPage.resubmit} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ),
      }
    : pendingCount > 0
      ? {
          Icon: Clock,
          tone: 'text-caution',
          title: t.verificationPage.pendingTitle,
          desc: t.verificationPage.pendingDesc,
          action: null,
        }
      : approvedCount > 0
        ? {
            Icon: CheckCircle2,
            tone: 'text-trust',
            title: t.verificationPage.stApproved,
            desc: tierInfo.desc,
            action: null,
          }
        : null;

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title={t.verificationPage.title} description={t.verificationPage.subtitle} />

      {/* ── Tier hero — the only elevated surface on the page ─────────────── */}
      <div className="bg-card rounded-panel border border-border-dim shadow-elevated p-5 sm:p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-card bg-brand-muted flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-brand" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-bold tracking-tight text-ink">{tierInfo.label}</h2>
              <StatusBadge variant={verificationTierVariant(tier)} label={tierInfo.label} dot />
            </div>
            <p className="text-sm text-ink-sub mt-0.5">{tierInfo.desc}</p>
          </div>
        </div>

        {/* Tier journey — where this provider sits on the ladder */}
        <div className="mt-6 grid grid-cols-4 gap-2">
          {TIER_ORDER.map((key, i) => {
            const done = i < tierIdx;
            const current = i === tierIdx;
            return (
              <div key={key} className="flex flex-col items-center text-center gap-1.5">
                <div className="flex items-center w-full">
                  <div className={cn('h-0.5 flex-1', i === 0 ? 'bg-transparent' : i <= tierIdx ? 'bg-brand' : 'bg-border')} />
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-3xs font-bold shrink-0',
                      done && 'bg-brand text-white',
                      current && 'bg-brand text-white ring-4 ring-brand/15',
                      !done && !current && 'bg-surface-alt text-ink-dim border border-border',
                    )}
                  >
                    {done ? <Check className="w-3 h-3" /> : i + 1}
                  </div>
                  <div className={cn('h-0.5 flex-1', i === TIER_ORDER.length - 1 ? 'bg-transparent' : i < tierIdx ? 'bg-brand' : 'bg-border')} />
                </div>
                <span className={cn('text-3xs font-semibold uppercase tracking-wide leading-tight', current ? 'text-ink' : 'text-ink-dim')}>
                  {TIER_LABELS[key].label}
                </span>
              </div>
            );
          })}
        </div>

        {/* The one "what happens next" line — no more banner stack */}
        {nextStep && (
          <div className="mt-5 pt-4 border-t border-border-dim flex items-start gap-3">
            <nextStep.Icon className={cn('w-5 h-5 shrink-0 mt-0.5', nextStep.tone)} />
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink">{nextStep.title}</p>
              <p className="text-xs text-ink-sub leading-relaxed mt-0.5">{nextStep.desc}</p>
              {nextStep.action}
            </div>
          </div>
        )}
      </div>

      {/* ── Documents ──────────────────────────────────────────────────────── */}
      {documents.length > 0 ? (
        <>
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <h3 className="text-xs font-bold text-ink-dim uppercase tracking-widest">
              {t.verificationPage.submittedDocuments}
            </h3>
            {/* Quiet count chips replace the three giant tinted stat boxes */}
            <div className="flex items-center gap-1.5">
              {pendingCount > 0 && (
                <StatusBadge variant="warning" dot label={`${pendingCount} ${t.verificationPage.statPending}`} />
              )}
              {approvedCount > 0 && (
                <StatusBadge variant="success" dot label={`${approvedCount} ${t.verificationPage.statApproved}`} />
              )}
              {rejectedCount > 0 && (
                <StatusBadge variant="danger" dot label={`${rejectedCount} ${t.verificationPage.statRejected}`} />
              )}
            </div>
          </div>

          <Card padding="none" className="divide-y divide-border-dim mb-8">
            {documents.map(doc => {
              const DocIcon = DOC_ICONS[doc.docType] ?? FileText;
              return (
                <div key={doc.id} className="px-4 sm:px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-input bg-surface-alt flex items-center justify-center shrink-0">
                      <DocIcon className="w-5 h-5 text-ink-sub" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-ink truncate">
                        {DOC_TYPE_LABELS[doc.docType] ?? doc.docType}
                      </p>
                      <p className="text-xs text-ink-dim mt-0.5">
                        {t.verificationPage.submittedPrefix}{' '}
                        {new Date(doc.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <StatusBadge
                      variant={STATUS_VARIANT[doc.status] ?? 'warning'}
                      label={STATUS_LABELS[doc.status] ?? STATUS_LABELS.PENDING}
                      dot
                      className="shrink-0"
                    />
                  </div>

                  {doc.status === 'REJECTED' && doc.rejectionReason && (
                    <div className="mt-2.5 ml-14 flex items-start justify-between gap-3 flex-wrap">
                      <p className="text-xs text-danger leading-relaxed min-w-0">{doc.rejectionReason}</p>
                      <Link
                        href="/provider/onboarding"
                        className="inline-flex items-center gap-1 text-xs font-bold text-danger hover:underline shrink-0"
                      >
                        {t.verificationPage.resubmit} <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
        </>
      ) : (
        <Card padding="lg" className="mb-8">
          <EmptyState
            icon={ShieldCheck}
            size="lg"
            title={t.verificationPage.emptyTitle}
            description={t.verificationPage.emptyDesc}
            action={
              <Link
                href="/provider/onboarding"
                className={buttonVariants({ variant: 'primary', size: 'lg' })}
              >
                {t.verificationPage.startVerification} <ArrowRight className="w-4 h-4" />
              </Link>
            }
          />
        </Card>
      )}
    </div>
  );
}
