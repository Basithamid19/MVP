'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ShieldCheck, Clock, CheckCircle2, XCircle, FileText,
  ArrowRight, Loader2, AlertCircle,
} from 'lucide-react';

interface VerificationDoc {
  id: string;
  docType: string;
  docUrl: string;
  status: string;
  rejectionReason?: string | null;
  createdAt: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ElementType; label: string }> = {
  PENDING:  { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: Clock, label: 'Under Review' },
  APPROVED: { bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle2, label: 'Approved' },
  REJECTED: { bg: 'bg-red-50', text: 'text-red-700', icon: XCircle, label: 'Rejected' },
};

const DOC_TYPE_LABELS: Record<string, string> = {
  ID: 'Identity Document',
  CERTIFICATE: 'Trade Certificate',
  INSURANCE: 'Liability Insurance',
  SELFIE: 'Selfie Proof',
};

const TIER_LABELS: Record<string, { label: string; desc: string; color: string }> = {
  TIER0_BASIC: { label: 'Basic', desc: 'Complete verification to unlock your badge', color: 'text-ink-dim' },
  TIER1_ID_VERIFIED: { label: 'ID Verified', desc: 'Your identity has been confirmed', color: 'text-blue-600' },
  TIER2_TRADE_VERIFIED: { label: 'Trade Verified', desc: 'Identity and trade credentials confirmed', color: 'text-brand' },
  TIER3_ENHANCED: { label: 'Enhanced', desc: 'Fully verified with insurance coverage', color: 'text-green-600' },
};

export default function VerificationStatusPage() {
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

  const tierInfo = TIER_LABELS[tier] ?? TIER_LABELS.TIER0_BASIC;
  const pendingCount = documents.filter(d => d.status === 'PENDING').length;
  const approvedCount = documents.filter(d => d.status === 'APPROVED').length;
  const rejectedCount = documents.filter(d => d.status === 'REJECTED').length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-ink mb-1">Verification Status</h1>
      <p className="text-sm text-ink-dim mb-8">Track your verification progress and manage your documents.</p>

      {/* Tier card */}
      <div className={`rounded-2xl border p-6 mb-6 ${isVerified ? 'bg-green-50 border-green-200' : 'bg-white border-border-dim'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isVerified ? 'bg-green-100' : 'bg-surface-alt'}`}>
            <ShieldCheck className={`w-7 h-7 ${isVerified ? 'text-green-600' : 'text-ink-dim'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className={`text-lg font-bold ${tierInfo.color}`}>{tierInfo.label}</h2>
              {isVerified && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                  Verified
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
          <div className="bg-yellow-50 rounded-xl p-4 text-center border border-yellow-100">
            <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
            <p className="text-xs font-medium text-yellow-600">Pending</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
            <p className="text-2xl font-bold text-green-700">{approvedCount}</p>
            <p className="text-xs font-medium text-green-600">Approved</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center border border-red-100">
            <p className="text-2xl font-bold text-red-700">{rejectedCount}</p>
            <p className="text-xs font-medium text-red-600">Rejected</p>
          </div>
        </div>
      )}

      {/* Documents list */}
      {documents.length > 0 ? (
        <div className="space-y-3 mb-8">
          <h3 className="text-xs font-bold text-ink-dim uppercase tracking-widest">Submitted Documents</h3>
          {documents.map(doc => {
            const st = STATUS_STYLES[doc.status] ?? STATUS_STYLES.PENDING;
            const Icon = st.icon;
            return (
              <div key={doc.id} className={`rounded-xl border p-4 ${st.bg} border-opacity-50`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 border border-border-dim">
                    <FileText className="w-5 h-5 text-ink-sub" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-ink">{DOC_TYPE_LABELS[doc.docType] ?? doc.docType}</p>
                    <p className="text-xs text-ink-dim">
                      Submitted {new Date(doc.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${st.bg} ${st.text}`}>
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">{st.label}</span>
                  </div>
                </div>
                {doc.status === 'REJECTED' && doc.rejectionReason && (
                  <div className="mt-3 ml-14 flex items-start gap-2 p-2.5 bg-white rounded-lg border border-red-200">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">{doc.rejectionReason}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-border-dim mb-8">
          <div className="w-16 h-16 bg-surface-alt rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-ink-dim" />
          </div>
          <h3 className="text-lg font-bold text-ink mb-2">No documents submitted</h3>
          <p className="text-sm text-ink-sub mb-6 max-w-sm mx-auto">
            Complete the verification process to earn your verified badge and build trust with customers.
          </p>
          <Link
            href="/provider/onboarding"
            className="inline-flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-dark transition-colors"
          >
            Start Verification <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Resubmit if rejected */}
      {rejectedCount > 0 && (
        <div className="p-5 bg-red-50 border border-red-100 rounded-xl">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-red-900 mb-1">Some documents were rejected</p>
              <p className="text-xs text-red-700 mb-3">
                Please re-submit the rejected documents with clearer images or updated credentials.
              </p>
              <Link
                href="/provider/onboarding"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 hover:text-red-900 transition-colors"
              >
                Resubmit documents <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Pending notice */}
      {pendingCount > 0 && rejectedCount === 0 && (
        <div className="p-5 bg-yellow-50 border border-yellow-100 rounded-xl">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-yellow-900 mb-1">Verification in progress</p>
              <p className="text-xs text-yellow-700">
                Our team typically reviews documents within 24 hours. You&apos;ll receive a notification once your verification is complete.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
