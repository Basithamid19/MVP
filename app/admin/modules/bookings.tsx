'use client';

import { useState } from 'react';
import { Briefcase, Clock } from 'lucide-react';
import {
  Button, DataTable, EmptyState, Modal, ModalFooter, PageHeader,
  StatusBadge, statusVariant,
} from '@/components/ui';
import type { Column } from '@/components/ui';
import { bookingStatus, paymentStatus } from '@/lib/status-labels';
import { useAdminList } from '../components/use-admin-data';
import {
  FilterBar, MobileRowCard, PartyPair, eur, shortDate, shortDateYear,
} from '../components/admin-ui';

const FILTERS = [
  { value: 'ALL',         label: 'All' },
  { value: 'SCHEDULED',   label: 'Scheduled' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED',   label: 'Completed' },
  { value: 'CANCELED',    label: 'Canceled' },
];

function BookingStatus({ status }: { status: string }) {
  return <StatusBadge variant={statusVariant('booking', status)} label={bookingStatus(status).label} />;
}

function PaymentStatus({ status }: { status?: string | null }) {
  const info = paymentStatus(status);
  if (!info) return <span className="text-ink-dim">—</span>;
  return <StatusBadge variant={statusVariant('payment', status!)} label={info.label} />;
}

export function BookingsModule() {
  const { rows: bookings, loading } = useAdminList<any>('bookings');
  const [filter, setFilter]   = useState('ALL');
  const [detail, setDetail]   = useState<any | null>(null);

  const filtered = filter === 'ALL' ? bookings : bookings.filter(b => b.status === filter);

  const columns: Column<any>[] = [
    {
      key: 'service',
      header: 'Service',
      sortValue: b => b.quote?.request?.category?.name ?? '',
      render: b => (
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold truncate">{b.quote?.request?.category?.name ?? 'Service'}</span>
          {b.quote?.request?.isUrgent && <StatusBadge variant="warning" label="Urgent" />}
        </div>
      ),
    },
    {
      key: 'parties',
      header: 'Customer → Provider',
      hideBelow: 'lg',
      sortValue: b => b.customer?.user?.name ?? '',
      render: b => <PartyPair from={b.customer?.user?.name} to={b.provider?.user?.name} />,
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: b => b.status,
      render: b => <BookingStatus status={b.status} />,
    },
    {
      key: 'payment',
      header: 'Payment',
      hideBelow: 'lg',
      sortValue: b => b.payment?.status ?? null,
      render: b => <PaymentStatus status={b.payment?.status} />,
    },
    {
      key: 'scheduled',
      header: 'Scheduled',
      hideBelow: 'md',
      align: 'right',
      sortValue: b => (b.scheduledAt ? new Date(b.scheduledAt).getTime() : null),
      render: b => <span className="text-ink-sub tabular-nums whitespace-nowrap">{shortDate(b.scheduledAt)}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      sortValue: b => b.totalAmount ?? 0,
      render: b => <span className="font-bold tabular-nums whitespace-nowrap">{eur(b.totalAmount)}</span>,
    },
  ];

  const mobileCard = (b: any) => (
    <MobileRowCard>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="font-bold text-sm truncate">{b.quote?.request?.category?.name ?? 'Service'}</span>
          <BookingStatus status={b.status} />
          {b.quote?.request?.isUrgent && <StatusBadge variant="warning" label="Urgent" />}
        </div>
        <span className="font-bold text-sm tabular-nums shrink-0">{eur(b.totalAmount)}</span>
      </div>
      <div className="flex items-center justify-between gap-3 text-xs text-ink-dim">
        <PartyPair from={b.customer?.user?.name} to={b.provider?.user?.name} />
        {b.scheduledAt && (
          <span className="flex items-center gap-1 shrink-0 tabular-nums">
            <Clock className="w-3 h-3" /> {shortDate(b.scheduledAt)}
          </span>
        )}
      </div>
    </MobileRowCard>
  );

  return (
    <div>
      <PageHeader title="Booking Console" description="Track every booking, status, and case owner." />

      <FilterBar
        options={FILTERS}
        value={filter}
        onChange={setFilter}
        count={v => (v === 'ALL' ? bookings.length : bookings.filter(b => b.status === v).length)}
      />

      <DataTable
        rows={filtered}
        rowKey={b => b.id}
        columns={columns}
        loading={loading}
        onRowClick={setDetail}
        mobileCard={mobileCard}
        rowActions={b => (
          <Button size="xs" variant="ghost" onClick={() => setDetail(b)}>View</Button>
        )}
        empty={
          <EmptyState
            icon={Briefcase}
            size="sm"
            title="No bookings match this filter"
            description="Try a different status filter or check back later."
          />
        }
      />

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.quote?.request?.category?.name ?? 'Booking'}
        description={detail ? `Booked ${shortDateYear(detail.createdAt)}` : undefined}
        footer={<ModalFooter><Button variant="secondary" onClick={() => setDetail(null)}>Close</Button></ModalFooter>}
      >
        {detail && (
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-dim">Status</dt>
              <dd><BookingStatus status={detail.status} /></dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-dim">Payment</dt>
              <dd><PaymentStatus status={detail.payment?.status} /></dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-dim">Customer</dt>
              <dd className="font-medium text-ink truncate">{detail.customer?.user?.name ?? '—'}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-dim">Provider</dt>
              <dd className="font-medium text-ink truncate">{detail.provider?.user?.name ?? '—'}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-dim">Scheduled</dt>
              <dd className="font-medium text-ink tabular-nums">{shortDateYear(detail.scheduledAt)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 pt-3 border-t border-border-dim">
              <dt className="text-ink-dim">Total</dt>
              <dd className="font-bold text-ink tabular-nums">{eur(detail.totalAmount)}</dd>
            </div>
            {detail.quote?.request?.description && (
              <div className="pt-3 border-t border-border-dim">
                <dt className="text-2xs font-bold uppercase tracking-widest text-ink-dim mb-1">Request</dt>
                <dd className="text-ink-sub leading-relaxed">{detail.quote.request.description}</dd>
              </div>
            )}
          </dl>
        )}
      </Modal>
    </div>
  );
}
