'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/app/_shared/components/ui/dataTable/dataTable';
import { NoContentCard } from '@/app/_shared/components/ui/noContentCard/noContentCard';
import { HistoryFilters } from '@/app/_shared/components/ui/historyFilters/historyFilters';
import { customerPaymentsApi } from '@/app/_shared/lib/api/client';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { formatDate } from '@/app/_shared/lib/utils/date';
import { ROUTES } from '@/app/_shared/lib/config/routes';

interface CustomerPayment extends Record<string, unknown> {
  id: number;
  invoiceNumber?: string;
  date: string;
  amount: number;
  notes?: string;
  account?: { id: number; name: string };
}

interface Props { customerId: number; }

export function CustomerPaymentHistoryTab({ customerId }: Props) {
  const router = useRouter();
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<{ from: string; to: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerPaymentsApi.getAll({
        customerId,
        limit: 10,
        page,
        search: search || undefined,
        fromDate: dateRange?.from,
        toDate: dateRange?.to,
      });
      const outer = res.data as { data: { data: CustomerPayment[]; meta: { totalItems: number; totalPages: number } } };
      const payload = outer.data;
      setPayments(payload.data ?? []);
      setTotalPages(payload.meta?.totalPages ?? 1);
      setTotalItems(payload.meta?.totalItems ?? 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [customerId, page, search, dateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => { setPage(1); }, [search, dateRange]);

  const columns: Column<CustomerPayment>[] = [
    {
      key: 'invoiceNumber',
      label: 'Invoice #',
      render: (row) => (
        <button
          type="button"
          className="text-(--color-primary) hover:underline font-medium text-left cursor-pointer"
          onClick={() => router.push(`${ROUTES.CUSTOMER_PAYMENTS}/${row.id}`)}
        >
          {row.invoiceNumber || `CP-${row.id}`}
        </button>
      ),
    },
    { key: 'date', label: 'Date', render: (row) => formatDate(row.date) },
    { key: 'amount', label: 'Amount Paid', render: (row) => formatPKR(row.amount) },
    { key: 'account', label: 'Account', render: (row) => row.account?.name || '-' },
    { key: 'notes', label: 'Notes', render: (row) => row.notes || '-' },
  ];

  const hasFilters = Boolean(search) || Boolean(dateRange);
  const showEmpty = !loading && payments.length === 0 && page === 1 && !hasFilters;

  return (
    <div>
      <HistoryFilters
        search={search}
        onSearchChange={setSearch}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        searchPlaceholder="Search by invoice # or notes..."
      />
      {showEmpty ? (
        <NoContentCard title="No payment history" description="No payments found for this customer." />
      ) : (
        <DataTable
          columns={columns}
          data={payments}
          totalItems={totalItems}
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          isLoading={loading}
        />
      )}
    </div>
  );
}
