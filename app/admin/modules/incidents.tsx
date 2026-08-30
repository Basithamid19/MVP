'use client';

import { useState } from 'react';
import { FileWarning, Plus } from 'lucide-react';
import {
  Button, DataTable, EmptyState, Input, Modal, ModalFooter, PageHeader,
  StatusBadge, Textarea,
} from '@/components/ui';
import type { Column, BadgeVariant } from '@/components/ui';
import { useAdminList, adminPatch } from '../components/use-admin-data';
import {
  FilterBar, MobileRowCard, SummaryStrip, daysSince, shortDate, time,
} from '../components/admin-ui';

const TICKET_VARIANT: Record<string, BadgeVariant> = {
  OPEN:     'warning',
  RESOLVED: 'success',
  CLOSED:   'neutral',
};

const FILTERS = [
  { value: 'ALL',      label: 'All' },
  { value: 'OPEN',     label: 'Open' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED',   label: 'Closed' },
];

export function IncidentModule() {
  const { rows: tickets, loading, reload } = useAdminList<any>('tickets');
  const [showForm, setShowForm]         = useState(false);
  const [form, setForm]                 = useState({ subject: '', description: '' });
  const [submitting, setSubmitting]     = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const createTicket = async () => {
    if (!form.subject.trim() || !form.description.trim()) return;
    setSubmitting(true);
    await adminPatch({ action: 'create_ticket', ...form, reporterId: 'admin' });
    setForm({ subject: '', description: '' });
    setShowForm(false);
    setSubmitting(false);
    reload();
  };

  const updateStatus = async (ticketId: string, status: string) => {
    await adminPatch({ action: 'update_ticket', ticketId, status });
    reload();
  };

  const openCount     = tickets.filter(t => t.status === 'OPEN').length;
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length;
  const closedCount   = tickets.filter(t => t.status === 'CLOSED').length;
  const filtered = statusFilter === 'ALL' ? tickets : tickets.filter(t => t.status === statusFilter);

  const columns: Column<any>[] = [
    {
      key: 'subject',
      header: 'Incident',
      sortValue: t => t.subject ?? '',
      render: t => (
        <div className="min-w-0 max-w-md">
          <p className="font-semibold truncate">{t.subject}</p>
          <p className="text-xs text-ink-dim line-clamp-1">{t.description}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: t => t.status ?? '',
      render: t => <StatusBadge variant={TICKET_VARIANT[t.status] ?? 'neutral'} label={t.status} />,
    },
    {
      key: 'age',
      header: 'Age',
      align: 'right',
      hideBelow: 'md',
      sortValue: t => new Date(t.createdAt).getTime(),
      render: t => <span className="text-ink-sub tabular-nums whitespace-nowrap">{daysSince(t.createdAt)}d</span>,
    },
    {
      key: 'created',
      header: 'Logged',
      align: 'right',
      hideBelow: 'lg',
      sortValue: t => new Date(t.createdAt).getTime(),
      render: t => (
        <span className="text-ink-sub tabular-nums whitespace-nowrap">
          {shortDate(t.createdAt)} · {time(t.createdAt)}
        </span>
      ),
    },
  ];

  const actions = (t: any) => (
    <div className="flex items-center justify-end gap-1.5">
      {t.status === 'OPEN' && (
        <Button size="xs" variant="trust" onClick={() => updateStatus(t.id, 'RESOLVED')}>Resolve</Button>
      )}
      {t.status !== 'CLOSED' && (
        <Button size="xs" variant="muted" onClick={() => updateStatus(t.id, 'CLOSED')}>Close</Button>
      )}
    </div>
  );

  const mobileCard = (t: any) => (
    <MobileRowCard
      className={
        t.status === 'CLOSED' ? 'opacity-60'
        : t.status === 'OPEN' ? 'border-caution-edge/50'
        : undefined
      }
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="font-bold text-sm truncate">{t.subject}</span>
          <StatusBadge variant={TICKET_VARIANT[t.status] ?? 'neutral'} label={t.status} />
        </div>
        <span className="text-2xs text-ink-dim tabular-nums shrink-0">{daysSince(t.createdAt)}d ago</span>
      </div>

      <p className="text-xs text-ink-sub mb-2.5 leading-relaxed line-clamp-2">{t.description}</p>

      <div className="flex items-center justify-between gap-2">
        <span className="text-2xs text-ink-dim tabular-nums">
          {shortDate(t.createdAt)} · {time(t.createdAt)}
        </span>
        {actions(t)}
      </div>
    </MobileRowCard>
  );

  return (
    <div>
      <PageHeader
        title="Incident Log"
        description="Safety concerns, escalations, and compliance tracking."
        action={
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-3.5 h-3.5" /> New
          </Button>
        }
      />

      {tickets.length > 0 && (
        <SummaryStrip
          items={[
            { label: 'total', value: tickets.length },
            ...(openCount > 0 ? [{ label: 'open', value: openCount, tone: 'caution' as const }] : []),
            { label: 'resolved', value: resolvedCount },
            { label: 'closed', value: closedCount },
          ]}
        />
      )}

      <FilterBar
        options={FILTERS}
        value={statusFilter}
        onChange={setStatusFilter}
        count={v =>
          v === 'ALL' ? tickets.length :
          v === 'OPEN' ? openCount :
          v === 'RESOLVED' ? resolvedCount :
          closedCount
        }
      />

      <DataTable
        rows={filtered}
        rowKey={t => t.id}
        columns={columns}
        loading={loading}
        rowActions={actions}
        mobileCard={mobileCard}
        empty={
          <EmptyState
            icon={FileWarning}
            size="sm"
            title="No incidents recorded"
            description="Safety concerns and escalations will be tracked here."
          />
        }
      />

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Record new incident"
        description="Logged against the admin reporter id, visible to the ops team only."
        footer={
          <ModalFooter>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={createTicket} loading={submitting}>Submit</Button>
          </ModalFooter>
        }
      >
        <div className="space-y-4">
          <Input
            label="Subject"
            value={form.subject}
            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            placeholder="e.g. Safety complaint – Marius K."
          />
          <Textarea
            label="Description"
            rows={4}
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe the incident, evidence, and recommended action…"
          />
        </div>
      </Modal>
    </div>
  );
}
