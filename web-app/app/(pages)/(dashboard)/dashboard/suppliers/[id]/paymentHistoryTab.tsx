'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/app/_shared/components/ui/dataTable/dataTable';
import { NoContentCard } from '@/app/_shared/components/ui/noContentCard/noContentCard';
import { supplierPaymentsApi } from '@/app/_shared/lib/api/client';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { ROUTES } from '@/app/_shared/lib/config/routes';

interface SupplierPayment extends Record<string, unknown> {
  id: number;
  invoiceNumber?: string;
  date: string;
  amount: number;
  notes?: string;
  account?: { id: number; name: string };
}

interface Props { supplierId: number; }

export function PaymentHistoryTab({ supplierId }: Props) {
  const router = useRouter();
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await supplierPaymentsApi.getAll({ supplierId, limit: 10, page: p });
      const outer = res.data as { data: { data: SupplierPayment[]; meta: { totalItems: number; totalPages: number } } };
      const payload = outer.data;
      setPayments(payload.data ?? []);
      setTotalPages(payload.meta?.totalPages ?? 1);
      setTotalItems(payload.meta?.totalItems ?? 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => { fetchData(page); }, [fetchData, page]);

  const columns: Column<SupplierPayment>[] = [
    {
      key: 'invoiceNumber',
      label: 'Invoice #',
      render: (row) => (
        <button
          type="button"
          className="text-(--color-primary) hover:underline font-medium text-left cursor-pointer"
          onClick={() => router.push(`${ROUTES.SUPPLIER_PAYMENTS}/${row.id}`)}
        >
          {row.invoiceNumber || `SP-${row.id}`}
        </button>
      ),
    },
    { key: 'date', label: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
    { key: 'amount', label: 'Amount Paid', render: (row) => formatPKR(row.amount) },
    { key: 'account', label: 'Account', render: (row) => row.account?.name || '-' },
    { key: 'notes', label: 'Notes', render: (row) => row.notes || '-' },
  ];

  if (!loading && payments.length === 0 && page === 1) {
    return <NoContentCard title="No payment history" description="No payments found for this supplier." />;
  }

  return (
    <DataTable
      columns={columns}
      data={payments}
      totalItems={totalItems}
      currentPage={page}
      totalPages={totalPages}
      onPageChange={setPage}
      isLoading={loading}
    />
  );
}
