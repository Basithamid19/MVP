'use client';

import React, { useMemo, useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

/* ─── DataTable ─────────────────────────────────────────────────────────────
 * The admin ops-console table. Generic, dependency-free, client-side sort.
 * No pagination by design — admin module filters handle volume for now.
 *
 * A column becomes sortable purely by providing `sortValue`. Columns with
 * `hideBelow` drop out under that breakpoint; when `mobileCard` is given the
 * whole table is replaced by a stacked card list below sm.
 *
 * Usage:
 *   <DataTable
 *     rows={bookings}
 *     rowKey={b => b.id}
 *     defaultSort={{ key: 'date', dir: 'desc' }}
 *     onRowClick={b => open(b)}
 *     loading={loading}
 *     empty={<EmptyState icon={Inbox} title="No bookings" size="sm" />}
 *     rowActions={b => <Button size="xs" variant="ghost">View</Button>}
 *     mobileCard={b => <BookingCard booking={b} />}
 *     columns={[
 *       { key: 'ref',  header: 'Ref', render: b => b.reference },
 *       { key: 'date', header: 'Date', sortValue: b => b.scheduledAt,
 *         hideBelow: 'md', align: 'right', width: 'w-40' },
 *     ]}
 *   />
 * ────────────────────────────────────────────────────────────────────────── */

type SortDir = 'asc' | 'desc';

const HIDE_BELOW = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
} as const;

const ALIGN = {
  left:   'text-left',
  center: 'text-center',
  right:  'text-right',
} as const;

export interface Column<T> {
  key:        string;
  header:     React.ReactNode;
  render?:    (row: T) => React.ReactNode;
  /** Providing this makes the column sortable. Nulls always sort last. */
  sortValue?: (row: T) => string | number | Date | null;
  align?:     keyof typeof ALIGN;
  width?:     string;
  hideBelow?: keyof typeof HIDE_BELOW;
}

export interface DataTableProps<T> {
  columns:       Column<T>[];
  rows:          T[];
  rowKey:        (row: T) => string;
  onRowClick?:   (row: T) => void;
  empty?:        React.ReactNode;
  loading?:      boolean;
  defaultSort?:  { key: string; dir: SortDir };
  dense?:        boolean;
  stickyHeader?: boolean;
  rowActions?:   (row: T) => React.ReactNode;
  /** When present, < sm renders this card per row instead of the table. */
  mobileCard?:   (row: T) => React.ReactNode;
  className?:    string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  empty,
  loading = false,
  defaultSort,
  dense = false,
  stickyHeader = true,
  rowActions,
  mobileCard,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: SortDir } | null>(
    defaultSort ?? null
  );

  const sorted = useMemo(() => {
    const col = sort && columns.find(c => c.key === sort.key);
    if (!col?.sortValue) return rows;

    const dir = sort!.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      // Nulls always sink to the bottom regardless of direction.
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'string' || typeof bv === 'string') {
        return String(av).localeCompare(String(bv)) * dir;
      }
      return (Number(av) - Number(bv)) * dir;
    });
  }, [rows, columns, sort]);

  const toggleSort = (key: string) =>
    setSort(prev =>
      prev?.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    );

  const cellPad = dense ? 'px-4 py-2.5' : 'px-4 py-3.5';
  const headPad = dense ? 'px-4 py-2'   : 'px-4 py-3';
  const colCount = columns.length + (rowActions ? 1 : 0);

  const table = (
    <div className="overflow-x-auto scrollbar-none">
      <table className="w-full border-collapse">
        <thead
          className={cn(
            'bg-surface-alt text-2xs font-bold uppercase tracking-widest text-ink-dim',
            stickyHeader && 'sticky top-0 z-10'
          )}
        >
          <tr>
            {columns.map(col => {
              const active = sort?.key === col.key;
              const SortIcon = !active ? ArrowUpDown : sort!.dir === 'asc' ? ArrowUp : ArrowDown;
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={
                    !col.sortValue ? undefined
                      : active ? (sort!.dir === 'asc' ? 'ascending' : 'descending')
                      : 'none'
                  }
                  className={cn(
                    headPad,
                    ALIGN[col.align ?? 'left'],
                    col.width,
                    col.hideBelow && HIDE_BELOW[col.hideBelow]
                  )}
                >
                  {col.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className={cn(
                        'inline-flex items-center gap-1.5 uppercase tracking-widest transition-colors hover:text-ink',
                        active && 'text-ink'
                      )}
                    >
                      {col.header}
                      <SortIcon className="w-3 h-3 shrink-0" aria-hidden="true" />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
            {rowActions && (
              <th scope="col" className={cn(headPad, 'text-right w-px')}>
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-border-dim">
                  {Array.from({ length: colCount }).map((__, j) => (
                    <td key={j} className={cellPad}>
                      <Skeleton rounded="chip" className="h-3 w-full max-w-32" />
                    </td>
                  ))}
                </tr>
              ))
            : sorted.map(row => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-t border-border-dim hover:bg-canvas transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {columns.map(col => (
                    <td
                      key={col.key}
                      className={cn(
                        cellPad,
                        'text-sm text-ink',
                        ALIGN[col.align ?? 'left'],
                        col.hideBelow && HIDE_BELOW[col.hideBelow]
                      )}
                    >
                      {col.render ? col.render(row) : (row as any)[col.key]}
                    </td>
                  ))}
                  {rowActions && (
                    <td
                      className={cn(cellPad, 'text-right whitespace-nowrap')}
                      onClick={e => e.stopPropagation()}
                    >
                      {rowActions(row)}
                    </td>
                  )}
                </tr>
              ))}
        </tbody>
      </table>

      {!loading && sorted.length === 0 && (
        <div className="px-4 py-10">{empty}</div>
      )}
    </div>
  );

  const wrapper = 'bg-card rounded-card border border-border-dim overflow-hidden';

  // No mobile card renderer → the table is the only presentation.
  if (!mobileCard) return <div className={cn(wrapper, className)}>{table}</div>;

  return (
    <div className={className}>
      <div className={cn('hidden sm:block', wrapper)}>{table}</div>

      <div className="sm:hidden space-y-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} rounded="card" className="h-24 w-full" />
            ))
          : sorted.length === 0
          ? empty
          : sorted.map(row => (
              <div
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? 'cursor-pointer' : undefined}
              >
                {mobileCard(row)}
              </div>
            ))}
      </div>
    </div>
  );
}
