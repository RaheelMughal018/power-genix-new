'use client';

import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/app/_shared/components/ui/dataTable/dataTable';
import { Button } from '@/app/_shared/components/ui/button/button';
import { DateRangeSelector } from '@/app/_shared/components/ui/dateSelector/dateRangeSelector';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { formatDate } from '@/app/_shared/lib/utils/date';
import { SearchableDropdown } from '@/app/_shared/components/ui/searchableDropdown/searchableDropdown';
import { usePurchaseInvoices, type PurchaseInvoice } from './usePurchaseInvoices';

export default function PurchaseInvoicesPage() {
  const router = useRouter();
  const {
    invoices, loading, page, search, totalPages, totalItems,
    supplierId, fromDate, toDate, suppliers, totalAmount,
    setPage, setSearch, setSupplierId, setFromDate, setToDate,
    handleExportCsv,
  } = usePurchaseInvoices();

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
    { key: 'supplier', label: 'Supplier', render: (row) => row.supplier?.name || '-' },
    { key: 'date', label: 'Date', render: (row) => formatDate(row.date) },
    { key: 'grandTotal', label: 'Amount', render: (row) => formatPKR(row.grandTotal ?? row.totalAmount) },
    { key: 'notes', label: 'Notes', render: (row) => row.notes || '-' },
    {
      key: 'actions', label: 'Actions', width: '160px',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => router.push(`${ROUTES.PURCHASE_INVOICES}/${row.id}`)}>View</Button>
          <Button size="sm" variant="outline" onClick={() => router.push(`${ROUTES.PURCHASE_INVOICES}/${row.id}/edit`)}>Edit</Button>
        </div>
      ),
    },
  ];

  const footerRow = (
    <tr>
      <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-(--color-text-primary)">Total</td>
      <td className="px-4 py-3 text-sm font-bold text-(--color-primary-600)">{formatPKR(totalAmount)}</td>
      <td colSpan={2} />
    </tr>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-(--color-text-primary)">Purchase Invoices</h1>
          <p className="text-(--color-text-secondary)">Manage supplier purchase invoices</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchableDropdown
          options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
          value={supplierId || ''}
          onChange={(v) => setSupplierId(v ? Number(v) : undefined)}
          placeholder="All Suppliers"
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
          <Button size="sm" variant="primary" onClick={() => router.push(ROUTES.PURCHASE_INVOICE_CREATE)}>
            Add Purchase
          </Button>
        }
        emptyTitle="No purchase invoices yet"
        emptyDescription="Add your first purchase invoice to get started."
        emptyAction={
          <Button size="sm" variant="primary" onClick={() => router.push(ROUTES.PURCHASE_INVOICE_CREATE)}>Add Purchase</Button>
        }
      />
    </div>
  );
}
