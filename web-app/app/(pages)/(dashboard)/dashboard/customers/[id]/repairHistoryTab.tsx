'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/app/_shared/components/ui/dataTable/dataTable';
import { NoContentCard } from '@/app/_shared/components/ui/noContentCard/noContentCard';
import { repairInvoicesApi } from '@/app/_shared/lib/api/client';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { ROUTES } from '@/app/_shared/lib/config/routes';

interface RepairInvoice extends Record<string, unknown> {
  id: number;
  invoiceNumber?: string;
  date: string;
  description: string;
  laborCost?: number;
  totalAmount?: number;
  isCharged: boolean;
}

interface Props { customerId: number; }

export function RepairHistoryTab({ customerId }: Props) {
  const router = useRouter();
  const [invoices, setInvoices] = useState<RepairInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await repairInvoicesApi.getAll({ customerId, limit: 10, page: p });
      const outer = res.data as { data: { data: RepairInvoice[]; meta: { totalItems: number; totalPages: number } } };
      const payload = outer.data;
      setInvoices(payload.data ?? []);
      setTotalPages(payload.meta?.totalPages ?? 1);
      setTotalItems(payload.meta?.totalItems ?? 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => { fetchData(page); }, [fetchData, page]);

  const columns: Column<RepairInvoice>[] = [
    {
      key: 'invoiceNumber',
      label: 'Invoice #',
      render: (row) => (
        <button
          type="button"
          className="text-(--color-primary) hover:underline font-medium text-left cursor-pointer"
          onClick={() => router.push(`${ROUTES.REPAIR_INVOICES}/${row.id}`)}
        >
          {row.invoiceNumber || `RI-${row.id}`}
        </button>
      ),
    },
    { key: 'date', label: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
    { key: 'description', label: 'Description', render: (row) => String(row.description || '-') },
    { key: 'totalAmount', label: 'Amount', render: (row) => formatPKR(row.totalAmount ?? row.laborCost ?? 0) },
    { key: 'isCharged', label: 'Charged', render: (row) => row.isCharged ? 'Yes' : 'No' },
  ];

  if (!loading && invoices.length === 0 && page === 1) {
    return <NoContentCard title="No repair history" description="No repair invoices found for this customer." />;
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
