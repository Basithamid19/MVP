'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';
import {
  Avatar, Button, DataTable, EmptyState, PageHeader, Select,
  StatusBadge, verificationTierVariant,
} from '@/components/ui';
import type { Column } from '@/components/ui';
import { useAdminList, adminPatch } from '../components/use-admin-data';
import { FilterBar, MobileRowCard, RefreshButton, SummaryStrip } from '../components/admin-ui';

const TIER_LABELS: Record<string, string> = {
  TIER0_BASIC:          'Tier 0',
  TIER1_ID_VERIFIED:    'Tier 1 – ID',
  TIER2_TRADE_VERIFIED: 'Tier 2 – Trade',
  TIER3_ENHANCED:       'Tier 3 – Enhanced',
};

const TIER_OPTIONS = [
  { value: 'TIER0_BASIC',          label: 'Tier 0 – Basic' },
  { value: 'TIER1_ID_VERIFIED',    label: 'Tier 1 – ID' },
  { value: 'TIER2_TRADE_VERIFIED', label: 'Tier 2 – Trade' },
  { value: 'TIER3_ENHANCED',       label: 'Tier 3 – Enhanced' },
];

const FILTERS = [
  { value: 'ALL',          label: 'All' },
  { value: 'NEEDS_REVIEW', label: 'Needs Review' },
  { value: 'APPROVED',     label: 'Approved' },
];

function TierBadge({ tier }: { tier: string }) {
  return <StatusBadge variant={verificationTierVariant(tier)} label={TIER_LABELS[tier] ?? tier} />;
}

export function ProvidersModule() {
  const { rows: providers, loading, reload } = useAdminList<any>('providers');
  const [filter, setFilter] = useState('ALL');

  // Same endpoint, method and payload as before — only the call site moved.
  const update = async (providerId: string, isVerified: boolean, verificationTier?: string) => {
    await adminPatch({ action: 'update_provider', providerId, isVerified, verificationTier });
    reload();
  };

  const needsReview = providers.filter(p => !p.isVerified);
  const approved    = providers.filter(p => p.isVerified);
  const filtered =
    filter === 'ALL' ? providers :
    filter === 'NEEDS_REVIEW' ? needsReview :
    approved;

  const categoryNames = (p: any) => (p.categories ?? []).map((c: any) => c.name).join(', ');

  const columns: Column<any>[] = [
    {
      key: 'provider',
      header: 'Provider',
      sortValue: p => p.user?.name ?? '',
      render: p => (
        <div className="flex items-center gap-3 min-w-0">
          <Avatar src={p.user?.image} name={p.user?.name ?? 'Provider'} size="sm" shape="square" />
          <div className="min-w-0">
            <p className="font-semibold truncate">{p.user?.name}</p>
            <p className="text-2xs text-ink-dim truncate">{categoryNames(p) || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'state',
      header: 'State',
      sortValue: p => (p.isVerified ? 'Active' : 'Unverified'),
      render: p => (
        <StatusBadge
          variant={p.isVerified ? 'success' : 'neutral'}
          label={p.isVerified ? 'Active' : 'Unverified'}
        />
      ),
    },
    {
      key: 'tier',
      header: 'Tier',
      hideBelow: 'md',
      sortValue: p => p.verificationTier ?? '',
      render: p => <TierBadge tier={p.verificationTier} />,
    },
    {
      key: 'jobs',
      header: 'Jobs',
      align: 'right',
      hideBelow: 'lg',
      sortValue: p => p._count?.bookings ?? 0,
      render: p => <span className="tabular-nums">{p._count?.bookings ?? 0}</span>,
    },
    {
      key: 'reviews',
      header: 'Reviews',
      align: 'right',
      hideBelow: 'lg',
      sortValue: p => p._count?.reviews ?? 0,
      render: p => <span className="tabular-nums">{p._count?.reviews ?? 0}</span>,
    },
    {
      key: 'rating',
      header: 'Rating',
      align: 'right',
      hideBelow: 'lg',
      sortValue: p => p.ratingAvg ?? null,
      render: p => (
        <span className="tabular-nums">{p.ratingAvg ? p.ratingAvg.toFixed(1) : '—'}</span>
      ),
    },
  ];

  const tierSelect = (p: any) => (
    <Select
      aria-label={`Verification tier for ${p.user?.name ?? 'provider'}`}
      defaultValue={p.verificationTier}
      onChange={e => update(p.id, p.isVerified, e.target.value)}
      wrapperClassName="w-auto"
      className="w-auto py-1.5 pl-2.5 pr-8 text-xs font-medium"
    >
      {TIER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </Select>
  );

  const actions = (p: any) => (
    <div className="flex items-center justify-end gap-1.5">
      {tierSelect(p)}
      {!p.isVerified ? (
        <Button size="xs" variant="trust" onClick={() => update(p.id, true, p.verificationTier)}>
          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
        </Button>
      ) : (
        <Button
          size="xs"
          variant="secondary"
          className="bg-caution-surface text-caution border-caution-edge hover:bg-caution-edge/60 hover:border-caution-edge"
          onClick={() => update(p.id, false, 'TIER0_BASIC')}
        >
          <AlertTriangle className="w-3.5 h-3.5" /> Suspend
        </Button>
      )}
      <Button size="xs" variant="danger" onClick={() => update(p.id, false, p.verificationTier)}>
        <XCircle className="w-3.5 h-3.5" /> Reject
      </Button>
    </div>
  );

  const mobileCard = (p: any) => (
    <MobileRowCard>
      <div className="flex items-center gap-3 mb-3">
        <Avatar src={p.user?.image} name={p.user?.name ?? 'Provider'} size="sm" shape="square" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm truncate">{p.user?.name}</span>
            <StatusBadge
              variant={p.isVerified ? 'success' : 'neutral'}
              label={p.isVerified ? 'Active' : 'Unverified'}
            />
          </div>
          <p className="text-2xs text-ink-dim truncate">{categoryNames(p) || '—'}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-border-dim">
        <div className="flex items-center gap-4 text-xs text-ink-dim">
          <span><span className="font-semibold text-ink tabular-nums">{p._count?.bookings ?? 0}</span> jobs</span>
          <span><span className="font-semibold text-ink tabular-nums">{p._count?.reviews ?? 0}</span> reviews</span>
        </div>
        <TierBadge tier={p.verificationTier} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">{actions(p)}</div>
    </MobileRowCard>
  );

  return (
    <div>
      <PageHeader
        title="Provider Queue"
        description="Review trust status, approve, suspend, or change provider tiers."
        action={<RefreshButton onClick={reload} />}
      />

      <SummaryStrip
        items={[
          { label: 'total', value: providers.length },
          ...(needsReview.length > 0
            ? [{ label: 'needs review', value: needsReview.length, tone: 'caution' as const }]
            : []),
          { label: 'approved', value: approved.length },
        ]}
      />

      <FilterBar
        options={FILTERS}
        value={filter}
        onChange={setFilter}
        count={v =>
          v === 'ALL' ? providers.length :
          v === 'NEEDS_REVIEW' ? needsReview.length :
          approved.length
        }
      />

      <DataTable
        rows={filtered}
        rowKey={p => p.id}
        columns={columns}
        loading={loading}
        rowActions={actions}
        mobileCard={mobileCard}
        empty={
          <EmptyState
            icon={ShieldCheck}
            size="sm"
            title="No providers match this filter"
            description="Providers will appear here once they register on the platform."
          />
        }
      />
    </div>
  );
}
