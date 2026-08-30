'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ShieldCheck, Clock, CheckCircle2, XCircle, FileText,
  ArrowRight, Loader2, AlertCircle,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { PageHeader } from '@/components/ui';

interface VerificationDoc {
  id: string;
  docType: string;
  docUrl: string;
  status: string;
  rejectionReason?: string | null;
  createdAt: string;
}

// Style-only map — labels come from the dictionary in the component.
const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  PENDING:  { bg: 'bg-caution-surface', text: 'text-caution', icon: Clock },
  APPROVED: { bg: 'bg-trust-surface', text: 'text-trust', icon: CheckCircle2 },
  REJECTED: { bg: 'bg-danger-surface', text: 'text-danger', icon: XCircle },
};

export default function VerificationStatusPage() {
  const t = useTranslation();
  const { data: session, status: authStatus } = useSession();
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [tier, setTier] = useState('TIER0_BASIC');
  const [documents, setDocuments] = useState<VerificationDoc[]>([]);

  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    fetch('/api/provider/verification')
      .then(r => r.json())
      .then(data => {
        setIsVerified(data.isVerified ?? false);
        setTier(data.verificationTier ?? 'TIER0_BASIC');
        setDocuments(data.documents ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authStatus]);

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-ink-dim" />
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

  const TIER_LABELS: Record<string, { label: string; desc: string; color: string }> = {
    TIER0_BASIC: { label: t.verificationPage.tierBasic, desc: t.verificationPage.tierBasicDesc, color: 'text-ink-dim' },
    TIER1_ID_VERIFIED: { label: t.verificationPage.tierIdVerified, desc: t.verificationPage.tierIdVerifiedDesc, color: 'text-info' },
    TIER2_TRADE_VERIFIED: { label: t.verificationPage.tierTradeVerified, desc: t.verificationPage.tierTradeVerifiedDesc, color: 'text-brand' },
    TIER3_ENHANCED: { label: t.verificationPage.tierEnhanced, desc: t.verificationPage.tierEnhancedDesc, color: 'text-trust' },
  };

  const tierInfo = TIER_LABELS[tier] ?? TIER_LABELS.TIER0_BASIC;
  const pendingCount = documents.filter(d => d.status === 'PENDING').length;
  const approvedCount = documents.filter(d => d.status === 'APPROVED').length;
  const rejectedCount = documents.filter(d => d.status === 'REJECTED').length;

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title={t.verificationPage.title} description={t.verificationPage.subtitle} />

      {/* Tier card */}
      <div className={`rounded-card border p-6 mb-6 ${isVerified ? 'bg-trust-surface border-trust-edge' : 'bg-card border-border-dim'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-card flex items-center justify-center shrink-0 ${isVerified ? 'bg-trust-edge' : 'bg-surface-alt'}`}>
            <ShieldCheck className={`w-7 h-7 ${isVerified ? 'text-trust' : 'text-ink-dim'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className={`text-lg font-bold ${tierInfo.color}`}>{tierInfo.label}</h2>
              {isVerified && (
                <span className="px-2 py-0.5 bg-trust-edge text-trust text-3xs font-bold uppercase tracking-wider rounded-full">
                  {t.common.verified}
                </span>
              )}
            </div>
            <p className="text-sm text-ink-sub">{tierInfo.desc}</p>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      {documents.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-caution-surface rounded-input p-4 text-center border border-caution-edge">
            <p className="text-2xl font-bold text-caution">{pendingCount}</p>
            <p className="text-xs font-medium text-caution">{t.verificationPage.statPending}</p>
          </div>
          <div className="bg-trust-surface rounded-input p-4 text-center border border-trust-edge">
            <p className="text-2xl font-bold text-trust">{approvedCount}</p>
            <p className="text-xs font-medium text-trust">{t.verificationPage.statApproved}</p>
          </div>
          <div className="bg-danger-surface rounded-input p-4 text-center border border-danger-edge">
            <p className="text-2xl font-bold text-danger">{rejectedCount}</p>
            <p className="text-xs font-medium text-danger">{t.verificationPage.statRejected}</p>
          </div>
        </div>
      )}

      {/* Documents list */}
      {documents.length > 0 ? (
        <div className="space-y-3 mb-8">
          <h3 className="text-xs font-bold text-ink-dim uppercase tracking-widest">{t.verificationPage.submittedDocuments}</h3>
          {documents.map(doc => {
            const st = STATUS_STYLES[doc.status] ?? STATUS_STYLES.PENDING;
            const Icon = st.icon;
            return (
              <div key={doc.id} className={`rounded-input border p-4 ${st.bg} border-opacity-50`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-card rounded-input flex items-center justify-center shrink-0 border border-border-dim">
                    <FileText className="w-5 h-5 text-ink-sub" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-ink">{DOC_TYPE_LABELS[doc.docType] ?? doc.docType}</p>
                    <p className="text-xs text-ink-dim">
                      {t.verificationPage.submittedPrefix} {new Date(doc.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${st.bg} ${st.text}`}>
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">{STATUS_LABELS[doc.status] ?? STATUS_LABELS.PENDING}</span>
                  </div>
                </div>
                {doc.status === 'REJECTED' && doc.rejectionReason && (
                  <div className="mt-3 ml-14 flex items-start gap-2 p-2.5 bg-card rounded-lg border border-danger-edge">
                    <AlertCircle className="w-3.5 h-3.5 text-danger shrink-0 mt-0.5" />
                    <p className="text-xs text-danger">{doc.rejectionReason}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-card border border-border-dim mb-8">
          <div className="w-16 h-16 bg-surface-alt rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-ink-dim" />
          </div>
          <h3 className="text-lg font-bold text-ink mb-2">{t.verificationPage.emptyTitle}</h3>
          <p className="text-sm text-ink-sub mb-6 max-w-sm mx-auto">
            {t.verificationPage.emptyDesc}
          </p>
          <Link
            href="/provider/onboarding"
            className="inline-flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-input font-bold hover:bg-brand-dark transition-colors"
          >
            {t.verificationPage.startVerification} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Resubmit if rejected */}
      {rejectedCount > 0 && (
        <div className="p-5 bg-danger-surface border border-danger-edge rounded-input">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-danger mb-1">{t.verificationPage.rejectedTitle}</p>
              <p className="text-xs text-danger mb-3">
                {t.verificationPage.rejectedDesc}
              </p>
              <Link
                href="/provider/onboarding"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-danger hover:text-danger transition-colors"
              >
                {t.verificationPage.resubmit} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Pending notice */}
      {pendingCount > 0 && rejectedCount === 0 && (
        <div className="p-5 bg-caution-surface border border-caution-edge rounded-input">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-caution shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-caution mb-1">{t.verificationPage.pendingTitle}</p>
              <p className="text-xs text-caution">
                {t.verificationPage.pendingDesc}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
