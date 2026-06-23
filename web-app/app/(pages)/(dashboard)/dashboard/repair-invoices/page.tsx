'use client';

import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/app/_shared/components/ui/dataTable/dataTable';
import { Button } from '@/app/_shared/components/ui/button/button';
import { StatusBadge } from '@/app/_shared/components/ui/statusBadge/statusBadge';
import { DateRangeSelector } from '@/app/_shared/components/ui/dateSelector/dateRangeSelector';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { formatDate } from '@/app/_shared/lib/utils/date';
import { SearchableDropdown } from '@/app/_shared/components/ui/searchableDropdown/searchableDropdown';
import { useRepairInvoices, type RepairInvoice } from './useRepairInvoices';

export default function RepairInvoicesPage() {
  const router = useRouter();
  const {
    invoices, loading, page, search, totalPages, totalItems,
    customerId, fromDate, toDate, isCharged, customers, totalAmount,
    setPage, setSearch, setCustomerId, setFromDate, setToDate, setIsCharged,
    handleExportCsv,
  } = useRepairInvoices();

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
          {row.invoiceNumber}
        </button>
      ),
    },
    { key: 'customer', label: 'Customer', render: (row) => row.customer?.name || '-' },
    { key: 'serialNumber', label: 'Serial / Product', render: (row) => (row.serialNumber as string) || '-' },
    { key: 'description', label: 'Description', render: (row) => (row.description as string) || '-' },
    { key: 'date', label: 'Date', render: (row) => formatDate(row.date) },
    { key: 'totalAmount', label: 'Amount', render: (row) => formatPKR(row.totalAmount) },
    {
      key: 'profit',
      label: 'Profit',
      render: (row) => (
        <span className={Number(row.profit ?? 0) >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
          {formatPKR(row.profit ?? 0)}
        </span>
      ),
    },
    {
      key: 'isCharged', label: 'Type',
      render: (row) => (
        <StatusBadge status={row.isCharged ? 'charged' : 'foc'} />
      ),
    },
    {
      key: 'actions', label: 'Actions', width: '160px',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => router.push(`${ROUTES.REPAIR_INVOICES}/${row.id}`)}>View</Button>
          <Button size="sm" variant="outline" onClick={() => router.push(`${ROUTES.REPAIR_INVOICES}/${row.id}/edit`)}>Edit</Button>
        </div>
      ),
    },
  ];

  const footerRow = (
    <tr>
      <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-(--color-text-primary)">Total</td>
      <td className="px-4 py-3 text-sm font-bold text-(--color-primary-600)">{formatPKR(totalAmount)}</td>
      <td colSpan={3} />
    </tr>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-(--color-text-primary)">Repair Invoices</h1>
          <p className="text-(--color-text-secondary)">Manage repair invoices (charged and FOC)</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchableDropdown
          options={customers.map((c) => ({ value: c.id, label: c.name }))}
          value={customerId || ''}
          onChange={(v) => setCustomerId(v ? Number(v) : undefined)}
          placeholder="All Customers"
        />

        <select
          value={isCharged === undefined ? '' : String(isCharged)}
          onChange={(e) => {
            if (e.target.value === '') setIsCharged(undefined);
            else setIsCharged(e.target.value === 'true');
          }}
          className="px-3 py-2 rounded-lg border border-(--color-border) bg-(--color-bg-primary) text-(--color-text-primary) text-sm"
        >
          <option value="">All Types</option>
          <option value="true">Charged</option>
          <option value="false">FOC</option>
        </select>

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
        data={invoices}
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
          <Button variant="primary" onClick={() => router.push(ROUTES.REPAIR_INVOICE_CREATE)}>
            Add Repair
          </Button>
        }
        emptyTitle="No repair invoices yet"
        emptyDescription="Add your first repair invoice to get started."
        emptyAction={
          <Button size="sm" variant="primary" onClick={() => router.push(ROUTES.REPAIR_INVOICE_CREATE)}>Add Repair</Button>
        }
      />
    </div>
  );
}
