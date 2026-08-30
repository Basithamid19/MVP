'use client';

import { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import {
  Avatar, Button, DataTable, EmptyState, Input, Modal, ModalFooter,
  PageHeader, StatusBadge,
} from '@/components/ui';
import type { Column, BadgeVariant } from '@/components/ui';
import { useAdminList } from '../components/use-admin-data';
import { FilterBar, MobileRowCard, shortDateYear } from '../components/admin-ui';

/* The old blue / purple / orange role map, mapped onto token badge variants. */
const ROLE_VARIANT: Record<string, BadgeVariant> = {
  CUSTOMER: 'info',
  PROVIDER: 'brand',
  ADMIN:    'warning',
};

const FILTERS = [
  { value: 'ALL',      label: 'All' },
  { value: 'CUSTOMER', label: 'CUSTOMER' },
  { value: 'PROVIDER', label: 'PROVIDER' },
  { value: 'ADMIN',    label: 'ADMIN' },
];

export function CRMModule() {
  const { rows: users, loading } = useAdminList<any>('users');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [creditUser, setCreditUser] = useState<any>(null);
  const [creditNote, setCreditNote] = useState('');

  const filtered = roleFilter === 'ALL' ? users : users.filter(u => u.role === roleFilter);

  // Credit issuing has no endpoint yet — the panel closes without a request,
  // exactly as before. Do not wire this to /api/admin until the action exists.
  const closeCredit = () => { setCreditUser(null); setCreditNote(''); };

  const providerMeta = (u: any) =>
    u.providerProfile
      ? `${u.providerProfile.completedJobs} jobs · ${u.providerProfile.ratingAvg?.toFixed(1)} avg`
      : null;

  const columns: Column<any>[] = [
    {
      key: 'user',
      header: 'User',
      sortValue: u => u.name ?? '',
      render: u => (
        <div className="flex items-center gap-3 min-w-0">
          <Avatar src={u.image} name={u.name ?? 'User'} size="sm" shape="square" />
          <div className="min-w-0">
            <p className="font-semibold truncate">{u.name}</p>
            <p className="text-2xs text-ink-dim truncate">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortValue: u => u.role ?? '',
      render: u => <StatusBadge variant={ROLE_VARIANT[u.role] ?? 'neutral'} label={u.role} />,
    },
    {
      key: 'activity',
      header: 'Activity',
      hideBelow: 'lg',
      sortValue: u => u.providerProfile?.completedJobs ?? null,
      render: u => <span className="text-ink-sub">{providerMeta(u) ?? '—'}</span>,
    },
    {
      key: 'joined',
      header: 'Joined',
      align: 'right',
      hideBelow: 'md',
      sortValue: u => new Date(u.createdAt).getTime(),
      render: u => (
        <span className="text-ink-sub tabular-nums whitespace-nowrap">{shortDateYear(u.createdAt)}</span>
      ),
    },
  ];

  const actions = (u: any) => (
    <Button size="xs" variant="secondary" onClick={() => { setCreditUser(u); setCreditNote(''); }}>
      <Plus className="w-3 h-3" /> Credit
    </Button>
  );

  const mobileCard = (u: any) => (
    <MobileRowCard>
      <div className="flex items-center gap-3 mb-2">
        <Avatar src={u.image} name={u.name ?? 'User'} size="sm" shape="square" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm truncate">{u.name}</span>
            <StatusBadge variant={ROLE_VARIANT[u.role] ?? 'neutral'} label={u.role} />
          </div>
          <p className="text-2xs text-ink-dim truncate">{u.email}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 text-xs text-ink-dim">
        <div className="flex items-center gap-3 min-w-0">
          <span className="tabular-nums">Joined {shortDateYear(u.createdAt)}</span>
          {providerMeta(u) && <span className="truncate">{providerMeta(u)}</span>}
        </div>
        {actions(u)}
      </div>
    </MobileRowCard>
  );

  return (
    <div>
      <PageHeader title="CRM / Referrals" description="User operations, credits, and activity tracking." />

      <FilterBar
        options={FILTERS}
        value={roleFilter}
        onChange={setRoleFilter}
        count={v => (v === 'ALL' ? users.length : users.filter(u => u.role === v).length)}
      />

      <DataTable
        rows={filtered}
        rowKey={u => u.id}
        columns={columns}
        loading={loading}
        rowActions={actions}
        mobileCard={mobileCard}
        empty={
          <EmptyState
            icon={Users}
            size="sm"
            title="No users match this filter"
            description="Registered customers, providers, and admins appear here."
          />
        }
      />

      <Modal
        open={!!creditUser}
        onClose={closeCredit}
        title="Issue credit"
        description={creditUser ? `Marketplace credit for ${creditUser.name}` : undefined}
        size="sm"
        footer={
          <ModalFooter>
            <Button variant="ghost" onClick={closeCredit}>Cancel</Button>
            <Button onClick={closeCredit}>Confirm</Button>
          </ModalFooter>
        }
      >
        <Input
          label="Description"
          value={creditNote}
          onChange={e => setCreditNote(e.target.value)}
          placeholder="Credit description…"
          autoFocus
        />
      </Modal>
    </div>
  );
}
