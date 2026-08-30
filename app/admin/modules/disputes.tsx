'use client';

import { DollarSign } from 'lucide-react';
import {
  Button, DataTable, EmptyState, PageHeader, StatusBadge, statusVariant,
} from '@/components/ui';
import type { Column } from '@/components/ui';
import { bookingStatus, paymentStatus } from '@/lib/status-labels';
import { useAdminList, adminPatch } from '../components/use-admin-data';
import { MobileRowCard, PartyPair, RefreshButton, daysSince, eur } from '../components/admin-ui';

const isRefunded = (b: any) => b.payment?.status === 'REFUNDED';
/** A case is actionable only while it is neither refunded nor already cancelled. */
const canRefund = (b: any) => !isRefunded(b) && b.status !== 'CANCELED';

export function DisputesModule() {
  const { rows, loading, reload } = useAdminList<any>('bookings');

  // The bookings section is reused for the dispute queue; the filter that used
  // to live in the fetch callback now runs on the shared hook's result.
  const bookings = rows.filter(
    (b: any) => b.status === 'CANCELED' || b.payment?.status === 'PENDING' || b.payment?.status === 'REFUNDED'
  );

  const refund = async (bookingId: string) => {
    await adminPatch({ action: 'refund', bookingId });
    reload();
  };

  const refundedCount = bookings.filter(isRefunded).length;
  const pendingCount  = bookings.length - refundedCount;

  const columns: Column<any>[] = [
    {
      key: 'service',
      header: 'Service',
      sortValue: b => b.quote?.request?.category?.name ?? '',
      render: b => (
        <span className={`font-semibold truncate ${isRefunded(b) ? 'text-ink-dim' : ''}`}>
          {b.quote?.request?.category?.name ?? 'Service'}
        </span>
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
      header: 'Booking',
      sortValue: b => b.status,
      render: b => (
        <StatusBadge variant={statusVariant('booking', b.status)} label={bookingStatus(b.status).label} />
      ),
    },
    {
      key: 'payment',
      header: 'Payment',
      hideBelow: 'md',
      sortValue: b => b.payment?.status ?? null,
      render: b => {
        const info = paymentStatus(b.payment?.status);
        if (!info) return <span className="text-ink-dim">—</span>;
        return isRefunded(b)
          ? <StatusBadge variant="success" label="Refunded" />
          : <StatusBadge variant={statusVariant('payment', b.payment.status)} label={info.label} />;
      },
    },
    {
      key: 'age',
      header: 'Age',
      align: 'right',
      hideBelow: 'md',
      sortValue: b => new Date(b.createdAt).getTime(),
      render: b => <span className="text-ink-sub tabular-nums whitespace-nowrap">{daysSince(b.createdAt)}d</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      sortValue: b => b.totalAmount ?? 0,
      render: b => <span className="font-bold tabular-nums whitespace-nowrap">{eur(b.totalAmount)}</span>,
    },
  ];

  const actions = (b: any) =>
    canRefund(b) ? (
      <Button size="xs" variant="danger" onClick={() => refund(b.id)}>
        <DollarSign className="w-3.5 h-3.5" /> Refund
      </Button>
    ) : isRefunded(b) ? (
      <span className="text-2xs font-semibold text-trust">Resolved</span>
    ) : null;

  const mobileCard = (b: any) => (
    <MobileRowCard className={isRefunded(b) ? 'opacity-70' : undefined}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="font-bold text-sm truncate">{b.quote?.request?.category?.name ?? 'Service'}</span>
          <StatusBadge variant={statusVariant('booking', b.status)} label={bookingStatus(b.status).label} />
          {b.payment && (isRefunded(b)
            ? <StatusBadge variant="success" label="Refunded" />
            : <StatusBadge variant={statusVariant('payment', b.payment.status)} label={paymentStatus(b.payment.status)!.label} />)}
        </div>
        <span className="font-bold text-sm tabular-nums shrink-0">{eur(b.totalAmount)}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs text-ink-dim min-w-0">
          <PartyPair from={b.customer?.user?.name} to={b.provider?.user?.name} />
          <span className="shrink-0 tabular-nums">{daysSince(b.createdAt)}d ago</span>
        </div>
        <div className="shrink-0">{actions(b)}</div>
      </div>
    </MobileRowCard>
  );

  return (
    <div>
      <PageHeader
        title="Refund & Disputes"
        description="Review cases, approve refunds, and enforce policy."
        action={<RefreshButton onClick={reload} />}
      />

      {bookings.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Total Cases', value: bookings.length,  tone: 'text-ink' },
            { label: 'Pending',     value: pendingCount,     tone: 'text-caution' },
            { label: 'Refunded',    value: refundedCount,    tone: 'text-trust' },
          ].map(k => (
            <div key={k.label} className="bg-card rounded-card border border-border-dim shadow-card px-3 py-2.5 text-center">
              <div className={`text-lg font-bold tabular-nums ${k.tone}`}>{k.value}</div>
              <div className="text-3xs font-semibold text-ink-dim uppercase tracking-wide">{k.label}</div>
            </div>
          ))}
        </div>
      )}

      <DataTable
        rows={bookings}
        rowKey={b => b.id}
        columns={columns}
        loading={loading}
        rowActions={actions}
        mobileCard={mobileCard}
        empty={
          <EmptyState
            icon={DollarSign}
            size="sm"
            title="No open disputes or refunds"
            description="Cancelled bookings and refund requests will surface here."
          />
        }
      />
    </div>
  );
}
