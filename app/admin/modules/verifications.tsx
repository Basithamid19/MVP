'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertCircle, CheckCircle2, ExternalLink, Eye, FileCheck, FileText,
  ShieldCheck, Upload, Users, XCircle, ZoomIn,
} from 'lucide-react';
import {
  Avatar, Button, DataTable, EmptyState, Modal, ModalFooter, PageHeader,
  StatusBadge, Textarea,
} from '@/components/ui';
import type { Column, BadgeVariant } from '@/components/ui';
import { useAdminList, adminPatch } from '../components/use-admin-data';
import {
  FilterBar, MobileRowCard, RefreshButton, SummaryStrip, shortDate,
} from '../components/admin-ui';

const REQUIRED_DOCS = ['SELFIE', 'ID', 'INSURANCE', 'CERTIFICATE'] as const;

const DOC_LABELS: Record<string, string> = {
  ID:          'Identity Document',
  CERTIFICATE: 'Certificate / License',
  INSURANCE:   'Liability Insurance',
  SELFIE:      'Selfie Verification',
};

const DOC_ICONS: Record<string, React.ElementType> = {
  ID: ShieldCheck, CERTIFICATE: FileCheck, INSURANCE: FileText, SELFIE: Users,
};

/* Replaces the old raw-palette STATUS_STYLE map with token badge variants. */
const DOC_VARIANT: Record<string, BadgeVariant> = {
  PENDING:    'warning',
  APPROVED:   'success',
  REJECTED:   'danger',
  INCOMPLETE: 'info',
  MISSING:    'neutral',
};

function getProviderStatus(documents: any[]): 'PENDING' | 'APPROVED' | 'REJECTED' | 'INCOMPLETE' {
  if (documents.length === 0) return 'INCOMPLETE';
  const hasPending  = documents.some((d: any) => d.status === 'PENDING');
  const hasRejected = documents.some((d: any) => d.status === 'REJECTED');
  const allApproved = documents.every((d: any) => d.status === 'APPROVED');
  if (allApproved && documents.length >= REQUIRED_DOCS.length) return 'APPROVED';
  if (hasPending) return 'PENDING';
  if (hasRejected) return 'REJECTED';
  return 'INCOMPLETE';
}

const FILTERS = [
  { value: 'PENDING',  label: 'Pending' },
  { value: 'ALL',      label: 'All' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export function VerificationsModule() {
  const { rows: cases, loading, reload, setRows } = useAdminList<any>('verifications');
  const [filter, setFilter]             = useState('ALL');
  const [reviewCase, setReviewCase]     = useState<any | null>(null);
  const [previewUrl, setPreviewUrl]     = useState<string | null>(null);
  const [rejectDocId, setRejectDocId]   = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const casesWithStatus = useMemo(
    () => cases.map(c => ({ ...c, overallStatus: getProviderStatus(c.documents) })),
    [cases]
  );

  const filtered = useMemo(
    () => (filter === 'ALL' ? casesWithStatus : casesWithStatus.filter(c => c.overallStatus === filter)),
    [casesWithStatus, filter]
  );

  const counts = useMemo(() => ({
    total:    casesWithStatus.length,
    PENDING:  casesWithStatus.filter(c => c.overallStatus === 'PENDING').length,
    APPROVED: casesWithStatus.filter(c => c.overallStatus === 'APPROVED').length,
    REJECTED: casesWithStatus.filter(c => c.overallStatus === 'REJECTED').length,
  }), [casesWithStatus]);

  /** Refetch + re-sync the open review case. Unchanged from the monolith. */
  const refreshCases = async () => {
    const res = await fetch('/api/admin?section=verifications');
    const d   = await res.json();
    const list = Array.isArray(d) ? d : [];
    setRows(list);
    if (reviewCase) {
      const updated = list.find((c: any) => c.providerId === reviewCase.providerId);
      if (updated) setReviewCase({ ...updated, overallStatus: getProviderStatus(updated.documents) });
      return updated;
    }
    return undefined;
  };

  const handleVerify = async (
    verificationId: string,
    status: string,
    rejectionReason?: string,
    tier?: string,
  ) => {
    setActionLoading(true);
    await adminPatch({ action: 'verify', verificationId, status, tier, rejectionReason });
    await refreshCases();
    setActionLoading(false);
  };

  const handleApproveAll = async (documents: any[]) => {
    setActionLoading(true);
    const pending = documents.filter((d: any) => d.status === 'PENDING');
    for (const doc of pending) {
      await adminPatch({
        action: 'verify',
        verificationId: doc.id,
        status: 'APPROVED',
        tier: 'TIER2_TRADE_VERIFIED',
      });
    }
    const updated = await refreshCases();
    // Approving the last pending doc can drop the case out of the list entirely.
    if (reviewCase && !updated) setReviewCase(null);
    setActionLoading(false);
  };

  const docCount   = (c: any) => c.documents.length;
  const pendingIn  = (c: any) => c.documents.filter((d: any) => d.status === 'PENDING').length;
  const categories = (c: any) => c.provider?.categories?.map((cat: any) => cat.name).join(', ') || '';
  const missingIn  = (c: any) => {
    const types = c.documents.map((d: any) => d.docType);
    return REQUIRED_DOCS.filter(t => !types.includes(t));
  };

  const columns: Column<any>[] = [
    {
      key: 'provider',
      header: 'Provider',
      sortValue: c => c.provider?.user?.name ?? '',
      render: c => (
        <div className="flex items-center gap-3 min-w-0">
          <Avatar src={c.provider?.user?.image} name={c.provider?.user?.name ?? 'Provider'} size="sm" />
          <div className="min-w-0">
            <p className="font-semibold truncate">{c.provider?.user?.name ?? 'Unknown'}</p>
            <p className="text-2xs text-ink-dim truncate">{c.provider?.user?.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'categories',
      header: 'Categories',
      hideBelow: 'lg',
      sortValue: c => categories(c),
      render: c => <span className="text-ink-sub truncate">{categories(c) || '—'}</span>,
    },
    {
      key: 'docs',
      header: 'Docs',
      align: 'center',
      sortValue: c => docCount(c),
      render: c => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <span className="tabular-nums font-semibold">{docCount(c)}/{REQUIRED_DOCS.length}</span>
          {pendingIn(c) > 0 && (
            <span className="text-2xs font-semibold text-caution">{pendingIn(c)} to review</span>
          )}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Case Status',
      sortValue: c => c.overallStatus,
      render: c => (
        <StatusBadge variant={DOC_VARIANT[c.overallStatus] ?? 'neutral'} label={c.overallStatus} />
      ),
    },
    {
      key: 'submitted',
      header: 'Submitted',
      align: 'right',
      hideBelow: 'md',
      sortValue: c => (c.submittedAt ? new Date(c.submittedAt).getTime() : null),
      render: c => (
        <span className="text-ink-sub tabular-nums whitespace-nowrap">{shortDate(c.submittedAt)}</span>
      ),
    },
  ];

  const actions = (c: any) => (
    <Button size="xs" variant="secondary" onClick={() => setReviewCase(c)}>
      <Eye className="w-3.5 h-3.5" /> Review
    </Button>
  );

  const mobileCard = (c: any) => {
    const missing = missingIn(c);
    return (
      <MobileRowCard>
        <div className="flex items-center gap-3 mb-3">
          <Avatar src={c.provider?.user?.image} name={c.provider?.user?.name ?? 'Provider'} size="md" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-ink truncate">{c.provider?.user?.name ?? 'Unknown'}</p>
            <p className="text-xs text-ink-dim truncate">{c.provider?.user?.email}</p>
            {categories(c) && <p className="text-3xs text-ink-dim mt-0.5 truncate">{categories(c)}</p>}
          </div>
          <StatusBadge variant={DOC_VARIANT[c.overallStatus] ?? 'neutral'} label={c.overallStatus} />
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 text-xs text-ink-dim">
          <span className="flex items-center gap-1">
            <Upload className="w-3 h-3" /> {docCount(c)}/{REQUIRED_DOCS.length} docs
          </span>
          {pendingIn(c) > 0 && <span className="text-caution font-semibold">{pendingIn(c)} to review</span>}
          {missing.length > 0 && (
            <span className="text-info">
              Missing: {missing.map(m => DOC_LABELS[m]?.split(' ')[0]).join(', ')}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {REQUIRED_DOCS.map(type => {
            const doc = c.documents.find((d: any) => d.docType === type);
            const st  = doc ? doc.status : 'MISSING';
            return (
              <StatusBadge
                key={type}
                dot
                variant={DOC_VARIANT[st] ?? 'neutral'}
                label={DOC_LABELS[type]?.split(' ')[0] ?? type}
              />
            );
          })}
        </div>

        <Button size="sm" variant="secondary" className="w-full" onClick={() => setReviewCase(c)}>
          <Eye className="w-3.5 h-3.5" /> Review Case
        </Button>
      </MobileRowCard>
    );
  };

  const hasPending = !!reviewCase?.documents?.some((d: any) => d.status === 'PENDING');

  return (
    <div>
      <PageHeader
        title="Verification Queue"
        description="Review provider verification cases — all documents grouped per provider."
        action={<RefreshButton onClick={reload} />}
      />

      <SummaryStrip
        items={[
          { label: 'providers', value: counts.total },
          ...(counts.PENDING > 0
            ? [{ label: 'pending', value: counts.PENDING, tone: 'caution' as const }]
            : []),
          { label: 'approved', value: counts.APPROVED },
          { label: 'rejected', value: counts.REJECTED },
        ]}
      />

      <FilterBar
        options={FILTERS}
        value={filter}
        onChange={setFilter}
        count={v => (v === 'ALL' ? counts.total : (counts as any)[v] ?? 0)}
      />

      <DataTable
        rows={filtered}
        rowKey={c => c.providerId}
        columns={columns}
        loading={loading}
        onRowClick={setReviewCase}
        rowActions={actions}
        mobileCard={mobileCard}
        empty={
          <EmptyState
            icon={ShieldCheck}
            size="sm"
            title="No verification cases"
            description="Provider submissions will appear here."
          />
        }
      />

      {/* ── Review case ─────────────────────────────────────────────────── */}
      <Modal
        open={!!reviewCase}
        // Both modals listen for Escape; while the lightbox is up this one
        // must no-op so closing the preview doesn't also drop the case.
        onClose={() => { if (!previewUrl) setReviewCase(null); }}
        size="md"
        title={reviewCase?.provider?.user?.name ?? 'Verification case'}
        description={reviewCase?.provider?.user?.email}
        footer={
          hasPending ? (
            <ModalFooter>
              <Button
                className="flex-1"
                loading={actionLoading}
                disabled={actionLoading}
                onClick={() => handleApproveAll(reviewCase.documents)}
              >
                {!actionLoading && <CheckCircle2 className="w-4 h-4" />} Approve All Pending
              </Button>
            </ModalFooter>
          ) : undefined
        }
      >
        {reviewCase && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-dim uppercase tracking-wider">Case Status</span>
              <StatusBadge
                variant={DOC_VARIANT[reviewCase.overallStatus] ?? 'neutral'}
                label={reviewCase.overallStatus}
              />
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-ink-dim uppercase tracking-wider">Document Checklist</p>

              {REQUIRED_DOCS.map(type => {
                const doc  = reviewCase.documents.find((d: any) => d.docType === type);
                const Icon = DOC_ICONS[type] || FileText;
                return (
                  <div key={type} className="bg-surface-alt rounded-card p-3.5">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-8 h-8 rounded-input bg-card flex items-center justify-center shrink-0 border border-border-dim">
                        <Icon className="w-4 h-4 text-ink-dim" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink">{DOC_LABELS[type]}</p>
                        <p className="text-3xs text-ink-dim">
                          {doc
                            ? `Uploaded ${new Date(doc.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                            : 'Not uploaded'}
                        </p>
                      </div>
                      <StatusBadge
                        variant={DOC_VARIANT[doc ? doc.status : 'MISSING'] ?? 'neutral'}
                        label={doc ? doc.status : 'Missing'}
                      />
                    </div>

                    {doc ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setPreviewUrl(doc.docUrl)}
                          className="w-full h-32 rounded-input overflow-hidden border border-border-dim bg-card mb-2 relative group cursor-pointer"
                        >
                          <img src={doc.docUrl} alt={DOC_LABELS[type] ?? doc.docType} className="w-full h-full object-cover" />
                          <span className="absolute inset-0 bg-ink/0 group-hover:bg-ink/30 transition-all flex items-center justify-center">
                            <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </span>
                        </button>

                        {doc.status === 'REJECTED' && doc.rejectionReason && (
                          <div className="flex items-start gap-2 p-2 bg-danger-surface rounded-input mb-2">
                            <AlertCircle className="w-3.5 h-3.5 text-danger shrink-0 mt-0.5" />
                            <p className="text-2xs text-danger">{doc.rejectionReason}</p>
                          </div>
                        )}

                        {doc.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <Button
                              size="xs"
                              variant="trust"
                              className="flex-1"
                              disabled={actionLoading}
                              onClick={() => handleVerify(doc.id, 'APPROVED', undefined, 'TIER1_ID_VERIFIED')}
                            >
                              <CheckCircle2 className="w-3 h-3" /> Approve
                            </Button>
                            <Button
                              size="xs"
                              variant="danger"
                              className="flex-1"
                              disabled={actionLoading}
                              onClick={() => { setRejectDocId(doc.id); setRejectReason(''); }}
                            >
                              <XCircle className="w-3 h-3" /> Reject
                            </Button>
                          </div>
                        )}

                        {rejectDocId === doc.id && (
                          <div className="mt-2 space-y-2">
                            <Textarea
                              rows={2}
                              autoFocus
                              value={rejectReason}
                              onChange={e => setRejectReason(e.target.value)}
                              placeholder="Reason for rejection (shown to provider)…"
                              className="bg-card py-2 text-xs resize-none"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="xs"
                                variant="danger"
                                className="flex-1"
                                disabled={actionLoading}
                                onClick={async () => {
                                  await handleVerify(doc.id, 'REJECTED', rejectReason || undefined);
                                  setRejectDocId(null);
                                  setRejectReason('');
                                }}
                              >
                                Confirm Reject
                              </Button>
                              <Button
                                size="xs"
                                variant="muted"
                                onClick={() => { setRejectDocId(null); setRejectReason(''); }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 p-2 rounded-input bg-card border border-dashed border-border-dim">
                        <Upload className="w-3.5 h-3.5 text-ink-dim" />
                        <p className="text-2xs text-ink-dim">Provider has not uploaded this document yet.</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Document preview ────────────────────────────────────────────── */}
      <Modal
        open={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        size="lg"
        title="Document preview"
        footer={
          <ModalFooter>
            {previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-sub hover:text-ink transition-colors mr-auto"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Original
              </a>
            )}
            <Button variant="secondary" onClick={() => setPreviewUrl(null)}>Close</Button>
          </ModalFooter>
        }
      >
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Document preview"
            className="w-full max-h-[60vh] rounded-input object-contain bg-surface-alt"
          />
        )}
      </Modal>
    </div>
  );
}
