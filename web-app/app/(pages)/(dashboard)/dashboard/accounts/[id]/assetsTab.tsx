'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { formatDate } from '@/app/_shared/lib/utils/date';
import { NoContentCard } from '@/app/_shared/components/ui/noContentCard/noContentCard';
import { Pagination } from '@/app/_shared/components/ui/pagination/pagination';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import type { AssetRecord } from './page';

interface Props {
  assets: AssetRecord[];
}

const PAGE_SIZE = 10;

export function AssetsTab({ assets }: Props) {
  const router = useRouter();
  const [page, setPage] = useState(1);

  if (assets.length === 0) {
    return <NoContentCard title="No assets" description="No assets purchased from this account." />;
  }

  const totalPages = Math.ceil(assets.length / PAGE_SIZE);
  const paginated = assets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-(--color-border) rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-(--color-bg-secondary) border-b border-(--color-border)">
              <th className="text-left px-4 py-3 font-semibold text-(--color-text-secondary)">Name</th>
              <th className="text-left px-4 py-3 font-semibold text-(--color-text-secondary)">Type</th>
              <th className="text-right px-4 py-3 font-semibold text-(--color-text-secondary)">Amount</th>
              <th className="text-left px-4 py-3 font-semibold text-(--color-text-secondary)">Purchase Date</th>
              <th className="text-left px-4 py-3 font-semibold text-(--color-text-secondary)">Notes</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((a) => (
              <tr
                key={a.id}
                className="border-b border-(--color-border) hover:bg-(--color-bg-tertiary) cursor-pointer"
                onClick={() => router.push(`${ROUTES.ASSETS}/${a.id}`)}
              >
                <td className="px-4 py-3 text-(--color-primary) font-medium">{a.name}</td>
                <td className="px-4 py-3 text-(--color-text-primary)">{a.type}</td>
                <td className="px-4 py-3 text-right font-medium text-(--color-error-600)">{formatPKR(a.amount)}</td>
                <td className="px-4 py-3 text-(--color-text-primary)">{formatDate(a.purchaseDate)}</td>
                <td className="px-4 py-3 text-(--color-text-secondary)">{a.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
