'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { NoContentCard } from '@/app/_shared/components/ui/noContentCard/noContentCard';
import { Pagination } from '@/app/_shared/components/ui/pagination/pagination';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import type { ExpenseRecord } from './page';

interface Props {
  expenses: ExpenseRecord[];
}

const PAGE_SIZE = 10;

export function ExpensesTab({ expenses }: Props) {
  const router = useRouter();
  const [page, setPage] = useState(1);

  if (expenses.length === 0) {
    return <NoContentCard title="No expenses" description="No expenses recorded for this account." />;
  }

  const totalPages = Math.ceil(expenses.length / PAGE_SIZE);
  const paginated = expenses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-(--color-border) rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-(--color-bg-secondary) border-b border-(--color-border)">
              <th className="text-left px-4 py-3 font-semibold text-(--color-text-secondary)">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-(--color-text-secondary)">Description</th>
              <th className="text-left px-4 py-3 font-semibold text-(--color-text-secondary)">Category</th>
              <th className="text-right px-4 py-3 font-semibold text-(--color-text-secondary)">Amount</th>
              <th className="text-left px-4 py-3 font-semibold text-(--color-text-secondary)">Notes</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((e) => (
              <tr
                key={e.id}
                className="border-b border-(--color-border) hover:bg-(--color-bg-tertiary) cursor-pointer"
                onClick={() => router.push(`${ROUTES.EXPENSES}/${e.id}/edit`)}
              >
                <td className="px-4 py-3 text-(--color-text-primary)">{e.date}</td>
                <td className="px-4 py-3 text-(--color-primary) font-medium">{e.description}</td>
                <td className="px-4 py-3 text-(--color-text-primary)">{e.category?.name ?? '—'}</td>
                <td className="px-4 py-3 text-right font-medium text-(--color-error-600)">{formatPKR(e.amount)}</td>
                <td className="px-4 py-3 text-(--color-text-secondary)">{e.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
