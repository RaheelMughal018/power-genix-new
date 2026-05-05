'use client';

import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/app/_shared/components/ui/dataTable/dataTable';
import { Button } from '@/app/_shared/components/ui/button/button';
import { DateRangeSelector } from '@/app/_shared/components/ui/dateSelector/dateRangeSelector';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { SearchableDropdown } from '@/app/_shared/components/ui/searchableDropdown/searchableDropdown';
import { useCustomerPayments, type CustomerPayment } from './useCustomerPayments';

export default function CustomerPaymentsPage() {
  const router = useRouter();
  const {
    payments, loading, page, search, totalPages, totalItems,
    customerId, accountId, fromDate, toDate, customers, accounts, totalAmount,
    setPage, setSearch, setCustomerId, setAccountId, setFromDate, setToDate,
    handleExportCsv,
  } = useCustomerPayments();

  const columns: Column<CustomerPayment>[] = [
    { key: 'invoiceNumber', label: 'Invoice #', render: (row) => row.invoiceNumber || `CP-${row.id}` },
    { key: 'customer', label: 'Customer', render: (row) => row.customer?.name || '-' },
    { key: 'date', label: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
    { key: 'amount', label: 'Amount', render: (row) => formatPKR(row.amount) },
    { key: 'account', label: 'Account', render: (row) => row.account?.name || '-' },
    {
      key: 'createdBy', label: 'Created By',
      render: (row) => row.createdBy
        ? `${row.createdBy.firstName}${row.createdBy.lastName ? ' ' + row.createdBy.lastName : ''}`
        : '-',
    },
    {
      key: 'actions', label: 'Actions', width: '160px',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => router.push(`${ROUTES.CUSTOMER_PAYMENTS}/${row.id}`)}>View</Button>
          <Button size="sm" variant="outline" onClick={() => router.push(`${ROUTES.CUSTOMER_PAYMENTS}/${row.id}/edit`)}>Edit</Button>
        </div>
      ),
    },
  ];

  const footerRow = (
    <tr>
      <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-(--color-text-primary)">Total</td>
      <td className="px-4 py-3 text-sm font-bold text-(--color-primary-600)">{formatPKR(totalAmount)}</td>
      <td colSpan={3} />
    </tr>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-(--color-text-primary)">Customer Payments</h1>
          <p className="text-(--color-text-secondary)">Manage payments received from customers</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchableDropdown
          options={customers.map((c) => ({ value: c.id, label: c.name }))}
          value={customerId || ''}
          onChange={(v) => setCustomerId(v ? Number(v) : undefined)}
          placeholder="All Customers"
        />

        <SearchableDropdown
          options={accounts.map((a) => ({ value: a.id, label: a.name }))}
          value={accountId || ''}
          onChange={(v) => setAccountId(v ? Number(v) : undefined)}
          placeholder="All Accounts"
        />

      </div>

      <DateRangeSelector
        from={fromDate}
        to={toDate}
        onChange={(range) => {
          setFromDate(range?.from ?? '');
          setToDate(range?.to ?? '');
        }}
      />

      <DataTable
        columns={columns}
        data={payments}
        totalItems={totalItems}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={setSearch}
        isLoading={loading}
        onExportCsv={handleExportCsv}
        footerRow={footerRow}
        actions={
          <Button variant="primary" onClick={() => router.push(ROUTES.CUSTOMER_PAYMENT_CREATE)}>
            Add Payment
          </Button>
        }
      />
    </div>
  );
}
