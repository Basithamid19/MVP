'use client';

import { Tag } from 'lucide-react';
import { DataTable, EmptyState, PageHeader } from '@/components/ui';
import type { Column } from '@/components/ui';
import { useAdminList } from '../components/use-admin-data';
import { MobileRowCard } from '../components/admin-ui';

/** Read-only platform config — there is no category CRUD endpoint today. */
const PLATFORM_FEE = 12; // %

export function CategoriesModule() {
  const { rows: categories, loading } = useAdminList<any>('categories');

  const columns: Column<any>[] = [
    {
      key: 'name',
      header: 'Category',
      sortValue: c => c.name ?? '',
      render: c => (
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-8 h-8 bg-surface-alt rounded-input flex items-center justify-center shrink-0">
            <Tag className="w-4 h-4 text-ink-dim" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold truncate">{c.name}</p>
            {c.description && <p className="text-2xs text-ink-dim truncate max-w-xs">{c.description}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'providers',
      header: 'Providers',
      align: 'right',
      sortValue: c => c._count?.providers ?? 0,
      render: c => <span className="tabular-nums font-semibold">{c._count?.providers ?? 0}</span>,
    },
    {
      key: 'requests',
      header: 'Requests',
      align: 'right',
      sortValue: c => c._count?.requests ?? 0,
      render: c => <span className="tabular-nums font-semibold">{c._count?.requests ?? 0}</span>,
    },
    {
      key: 'fee',
      header: 'Take Rate',
      align: 'right',
      hideBelow: 'md',
      render: () => <span className="tabular-nums text-ink-sub">{PLATFORM_FEE}%</span>,
    },
  ];

  const mobileCard = (c: any) => (
    <MobileRowCard>
      <div className="flex items-start gap-3 mb-2.5">
        <span className="w-8 h-8 bg-surface-alt rounded-input flex items-center justify-center shrink-0 mt-0.5">
          <Tag className="w-4 h-4 text-ink-dim" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm">{c.name}</p>
          {c.description && <p className="text-xs text-ink-dim mt-0.5 line-clamp-1">{c.description}</p>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 ml-11">
        {[
          { value: c._count?.providers ?? 0, label: 'providers' },
          { value: c._count?.requests ?? 0,  label: 'requests' },
          { value: `${PLATFORM_FEE}%`,        label: 'fee' },
        ].map(t => (
          <div key={t.label} className="text-center px-2 py-1.5 rounded-input bg-surface-alt">
            <span className="text-sm font-bold tabular-nums text-ink">{t.value}</span>
            <span className="text-3xs text-ink-dim ml-1">{t.label}</span>
          </div>
        ))}
      </div>
    </MobileRowCard>
  );

  return (
    <div>
      <PageHeader
        title="Category Config"
        description="Service taxonomy, supply coverage, and platform fee rules."
      />

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { value: `${PLATFORM_FEE}%`,     label: 'Take Rate' },
          { value: categories.length,      label: 'Categories' },
          { value: 'Quote',                label: 'Mode' },
        ].map(k => (
          <div key={k.label} className="bg-card rounded-card border border-border-dim shadow-card px-3 py-2.5 text-center">
            <div className="text-lg font-bold tabular-nums text-ink">{k.value}</div>
            <div className="text-3xs font-semibold text-ink-dim uppercase tracking-wide">{k.label}</div>
          </div>
        ))}
      </div>

      <DataTable
        rows={categories}
        rowKey={c => c.id}
        columns={columns}
        loading={loading}
        mobileCard={mobileCard}
        empty={
          <EmptyState
            icon={Tag}
            size="sm"
            title="No categories configured"
            description="Seed the service taxonomy to open the marketplace for requests."
          />
        }
      />
    </div>
  );
}
