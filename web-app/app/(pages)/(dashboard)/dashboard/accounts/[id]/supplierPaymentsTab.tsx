'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { NoContentCard } from '@/app/_shared/components/ui/noContentCard/noContentCard';
import { Pagination } from '@/app/_shared/components/ui/pagination/pagination';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import type { SupplierPaymentRecord } from './page';

interface Props {
  payments: SupplierPaymentRecord[];
}

const PAGE_SIZE = 10;

export function SupplierPaymentsTab({ payments }: Props) {
  const router = useRouter();
  const [page, setPage] = useState(1);

  if (payments.length === 0) {
    return <NoContentCard title="No payments made" description="No supplier payments recorded for this account." />;
  }

  const totalPages = Math.ceil(payments.length / PAGE_SIZE);
  const paginated = payments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-(--color-border) rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-(--color-bg-secondary) border-b border-(--color-border)">
              <th className="text-left px-4 py-3 font-semibold text-(--color-text-secondary)">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-(--color-text-secondary)">Invoice #</th>
              <th className="text-left px-4 py-3 font-semibold text-(--color-text-secondary)">Supplier</th>
              <th className="text-right px-4 py-3 font-semibold text-(--color-text-secondary)">Amount</th>
              <th className="text-left px-4 py-3 font-semibold text-(--color-text-secondary)">Notes</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((p) => (
              <tr
                key={p.id}
                className="border-b border-(--color-border) hover:bg-(--color-bg-tertiary) cursor-pointer"
                onClick={() => router.push(`${ROUTES.SUPPLIER_PAYMENTS}/${p.id}`)}
              >
                <td className="px-4 py-3 text-(--color-text-primary)">{p.date}</td>
                <td className="px-4 py-3 text-(--color-primary) font-medium">{p.invoiceNumber}</td>
                <td className="px-4 py-3 text-(--color-text-primary)">{p.supplier?.name ?? '—'}</td>
                <td className="px-4 py-3 text-right font-medium text-(--color-error-600)">{formatPKR(p.amount)}</td>
                <td className="px-4 py-3 text-(--color-text-secondary)">{p.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
