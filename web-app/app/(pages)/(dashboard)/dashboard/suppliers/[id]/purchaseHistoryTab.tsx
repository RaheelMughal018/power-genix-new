'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/app/_shared/components/ui/dataTable/dataTable';
import { NoContentCard } from '@/app/_shared/components/ui/noContentCard/noContentCard';
import { purchaseInvoicesApi } from '@/app/_shared/lib/api/client';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { formatDate } from '@/app/_shared/lib/utils/date';
import { ROUTES } from '@/app/_shared/lib/config/routes';

interface PurchaseInvoice extends Record<string, unknown> {
  id: number;
  invoiceNumber: string;
  date: string;
  grandTotal?: number;
  totalAmount?: number;
}

interface Props { supplierId: number; }

export function PurchaseHistoryTab({ supplierId }: Props) {
  const router = useRouter();
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await purchaseInvoicesApi.getAll({ supplierId, limit: 10, page: p });
      const outer = res.data as { data: { data: PurchaseInvoice[]; meta: { totalItems: number; totalPages: number } } };
      const payload = outer.data;
      setInvoices(payload.data ?? []);
      setTotalPages(payload.meta?.totalPages ?? 1);
      setTotalItems(payload.meta?.totalItems ?? 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => { fetchData(page); }, [fetchData, page]);

  const columns: Column<PurchaseInvoice>[] = [
    {
      key: 'invoiceNumber',
      label: 'Invoice #',
      render: (row) => (
        <button
          type="button"
          className="text-(--color-primary) hover:underline font-medium text-left cursor-pointer"
          onClick={() => router.push(`${ROUTES.PURCHASE_INVOICES}/${row.id}`)}
        >
          {row.invoiceNumber}
        </button>
      ),
    },
    { key: 'date', label: 'Date', render: (row) => formatDate(row.date) },
    { key: 'grandTotal', label: 'Amount', render: (row) => formatPKR(row.grandTotal ?? row.totalAmount ?? 0) },
  ];

  if (!loading && invoices.length === 0 && page === 1) {
    return <NoContentCard title="No purchase history" description="No purchase invoices found for this supplier." />;
  }

  return (
    <DataTable
      columns={columns}
      data={invoices}
      totalItems={totalItems}
      currentPage={page}
      totalPages={totalPages}
      onPageChange={setPage}
      isLoading={loading}
    />
  );
}
