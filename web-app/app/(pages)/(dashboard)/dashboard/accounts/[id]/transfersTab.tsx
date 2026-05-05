'use client';

import { useState } from 'react';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { NoContentCard } from '@/app/_shared/components/ui/noContentCard/noContentCard';
import { Pagination } from '@/app/_shared/components/ui/pagination/pagination';
import type { TransferRecord } from './page';

interface Props {
  transfersIn: TransferRecord[];
  transfersOut: TransferRecord[];
  accountName: string;
}

const PAGE_SIZE = 10;

export function TransfersTab({ transfersIn, transfersOut }: Props) {
  const [page, setPage] = useState(1);

  const allTransfers = [
    ...transfersIn.map((t) => ({ ...t, direction: 'in' as const, counterpart: t.fromAccount?.name ?? '—' })),
    ...transfersOut.map((t) => ({ ...t, direction: 'out' as const, counterpart: t.toAccount?.name ?? '—' })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  if (allTransfers.length === 0) {
    return <NoContentCard title="No transfers" description="No transfers recorded for this account." />;
  }

  const totalPages = Math.ceil(allTransfers.length / PAGE_SIZE);
  const paginated = allTransfers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-(--color-border) rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-(--color-bg-secondary) border-b border-(--color-border)">
              <th className="text-left px-4 py-3 font-semibold text-(--color-text-secondary)">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-(--color-text-secondary)">Direction</th>
              <th className="text-left px-4 py-3 font-semibold text-(--color-text-secondary)">From / To</th>
              <th className="text-right px-4 py-3 font-semibold text-(--color-text-secondary)">Amount</th>
              <th className="text-left px-4 py-3 font-semibold text-(--color-text-secondary)">Notes</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((t) => (
              <tr key={`${t.direction}-${t.id}`} className="border-b border-(--color-border) hover:bg-(--color-bg-tertiary)">
                <td className="px-4 py-3 text-(--color-text-primary)">{t.date}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    t.direction === 'in'
                      ? 'bg-(--color-success-50) text-(--color-success-700)'
                      : 'bg-(--color-error-50) text-(--color-error-700)'
                  }`}>
                    {t.direction === 'in' ? 'Received' : 'Sent'}
                  </span>
                </td>
                <td className="px-4 py-3 text-(--color-text-primary)">
                  {t.direction === 'in' ? `From: ${t.counterpart}` : `To: ${t.counterpart}`}
                </td>
                <td className={`px-4 py-3 text-right font-medium ${
                  t.direction === 'in' ? 'text-(--color-success-600)' : 'text-(--color-error-600)'
                }`}>
                  {t.direction === 'in' ? '+' : '-'}{formatPKR(t.amount)}
                </td>
                <td className="px-4 py-3 text-(--color-text-secondary)">{t.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
