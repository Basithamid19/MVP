'use client';

import { useState } from 'react';
import { Eye, EyeOff, Star } from 'lucide-react';
import { Button, DataTable, EmptyState, PageHeader, StatusBadge } from '@/components/ui';
import type { Column } from '@/components/ui';
import { useAdminList, adminPatch } from '../components/use-admin-data';
import {
  FilterBar, MobileRowCard, PartyPair, RefreshButton, SummaryStrip, shortDate,
} from '../components/admin-ui';

const FILTERS = [
  { value: 'ALL',     label: 'All' },
  { value: 'VISIBLE', label: 'Visible' },
  { value: 'BLOCKED', label: 'Blocked' },
];

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= rating ? 'text-caution fill-caution' : 'text-border'}`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

export function ReviewsModule() {
  const { rows: reviews, loading, reload } = useAdminList<any>('reviews');
  const [filter, setFilter] = useState('ALL');

  const toggle = async (reviewId: string, isHidden: boolean) => {
    await adminPatch({ action: isHidden ? 'unblock_review' : 'block_review', reviewId });
    reload();
  };

  const visible = reviews.filter(r => !r.isHidden);
  const blocked = reviews.filter(r => r.isHidden);
  const filtered =
    filter === 'ALL' ? reviews :
    filter === 'VISIBLE' ? visible :
    blocked;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum: number, r: any) => sum + (r.rating ?? 0), 0) / reviews.length).toFixed(1)
    : '—';

  const columns: Column<any>[] = [
    {
      key: 'rating',
      header: 'Rating',
      width: 'w-36',
      sortValue: r => r.rating ?? 0,
      render: r => (
        <div className="flex items-center gap-2">
          <Stars rating={r.rating} />
          <span className="text-xs font-bold tabular-nums text-ink">{r.rating}/5</span>
        </div>
      ),
    },
    {
      key: 'comment',
      header: 'Comment',
      sortValue: r => r.comment ?? null,
      render: r => (
        <p className="text-ink-sub line-clamp-2 max-w-md">
          {r.comment ? `“${r.comment}”` : <span className="text-ink-dim">No comment</span>}
        </p>
      ),
    },
    {
      key: 'parties',
      header: 'Reviewer → Provider',
      hideBelow: 'lg',
      sortValue: r => r.provider?.user?.name ?? '',
      render: r => <PartyPair from={r.customer?.user?.name} to={r.provider?.user?.name} />,
    },
    {
      key: 'visibility',
      header: 'Visibility',
      sortValue: r => (r.isHidden ? 'Blocked' : 'Visible'),
      render: r => (
        <StatusBadge variant={r.isHidden ? 'danger' : 'success'} label={r.isHidden ? 'Blocked' : 'Visible'} />
      ),
    },
    {
      key: 'date',
      header: 'Date',
      align: 'right',
      hideBelow: 'md',
      sortValue: r => new Date(r.createdAt).getTime(),
      render: r => <span className="text-ink-sub tabular-nums whitespace-nowrap">{shortDate(r.createdAt)}</span>,
    },
  ];

  const actions = (r: any) => (
    <Button
      size="xs"
      variant={r.isHidden ? 'trust' : 'danger'}
      onClick={() => toggle(r.id, r.isHidden)}
    >
      {r.isHidden ? <><Eye className="w-3.5 h-3.5" /> Restore</> : <><EyeOff className="w-3.5 h-3.5" /> Block</>}
    </Button>
  );

  const mobileCard = (r: any) => (
    <MobileRowCard className={r.isHidden ? 'border-danger-edge/50 opacity-60' : undefined}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Stars rating={r.rating} />
          <span className="text-xs font-bold tabular-nums text-ink">{r.rating}/5</span>
          {r.isHidden && <StatusBadge variant="danger" label="Blocked" />}
        </div>
        {actions(r)}
      </div>

      {r.comment && (
        <p className="text-sm text-ink-sub mb-2 leading-relaxed line-clamp-2">“{r.comment}”</p>
      )}

      <div className="flex items-center justify-between gap-3 text-xs text-ink-dim">
        <PartyPair from={r.customer?.user?.name} to={r.provider?.user?.name} />
        <span className="tabular-nums shrink-0">{shortDate(r.createdAt)}</span>
      </div>
    </MobileRowCard>
  );

  return (
    <div>
      <PageHeader
        title="Review Moderation"
        description="Maintain review integrity and handle flagged content."
        action={<RefreshButton onClick={reload} />}
      />

      {reviews.length > 0 && (
        <SummaryStrip
          items={[
            { label: 'total', value: reviews.length },
            { label: 'avg stars', value: avgRating },
            ...(blocked.length > 0
              ? [{ label: 'blocked', value: blocked.length, tone: 'danger' as const }]
              : []),
          ]}
        />
      )}

      <FilterBar
        options={FILTERS}
        value={filter}
        onChange={setFilter}
        count={v =>
          v === 'ALL' ? reviews.length :
          v === 'VISIBLE' ? visible.length :
          blocked.length
        }
      />

      <DataTable
        rows={filtered}
        rowKey={r => r.id}
        columns={columns}
        loading={loading}
        rowActions={actions}
        mobileCard={mobileCard}
        empty={
          <EmptyState
            icon={Star}
            size="sm"
            title="No reviews to moderate"
            description="Reviews will appear here as customers leave feedback."
          />
        }
      />
    </div>
  );
}
