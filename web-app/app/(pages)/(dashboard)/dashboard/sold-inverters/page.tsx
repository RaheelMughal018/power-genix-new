'use client';

import Link from 'next/link';
import { DataTable, type Column } from '@/app/_shared/components/ui/dataTable/dataTable';
import { SummaryCards } from '@/app/_shared/components/ui/summaryCards/summaryCards';
import { FilterBar } from '@/app/_shared/components/ui/filterBar/filterBar';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import { useSoldInverters, type SoldInverter } from './useSoldInverters';

export default function SoldInvertersPage() {
  const {
    inverters,
    loading,
    page,
    totalPages,
    totalItems,
    summary,
    customers,
    filterCustomerId,
    search,
    setPage,
    handleFilterChange,
    handleDateRangeChange,
    handleSearchChange,
    handleExportCsv,
  } = useSoldInverters();

  const summaryCards = [
    { label: 'Total Production Cost', value: formatPKR(summary.totalProductionCost) },
    { label: 'Total Sale Cost', value: formatPKR(summary.totalSaleCost) },
    { label: 'Total Profit', value: formatPKR(summary.totalProfit) },
    { label: 'Total Quantity', value: String(summary.totalQuantity) },
  ];

  const customerFilterOptions = customers.map((c) => ({ label: c.name, value: String(c.id) }));

  const filterConfigs = [
    { key: 'customerId', label: 'Customer', options: customerFilterOptions, value: filterCustomerId },
  ];

  const columns: Column<SoldInverter>[] = [
    {
      key: 'serialNumber',
      label: 'Serial #',
      width: '140px',
      render: (row) => (
        <span className="font-mono text-sm">{row.serialNumber ?? '—'}</span>
      ),
    },
    {
      key: 'item',
      label: 'Item Name',
      render: (row) => row.item?.name ?? '—',
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (row) => row.customer?.name ?? '—',
    },
    {
      key: 'saleInvoice',
      label: 'Sale Invoice',
      render: (row) => row.saleInvoice ? (
        <Link
          href={`${ROUTES.SALE_INVOICES}/${row.saleInvoice.id}`}
          className="text-(--color-primary) hover:underline cursor-pointer font-medium"
        >
          {row.saleInvoice.invoiceNumber}
        </Link>
      ) : '—',
    },
    {
      key: 'productionCost',
      label: 'Production Cost',
      render: (row) => formatPKR(row.productionCost),
    },
    {
      key: 'saleCost',
      label: 'Sale Cost',
      render: (row) => formatPKR(row.saleCost),
    },
    {
      key: 'profit',
      label: 'Profit',
      render: (row) => (
        <span className={Number(row.profit) >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
          {formatPKR(row.profit)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-(--color-text-primary)">Sold Inverters</h1>
        <p className="text-(--color-text-secondary)">View profitability of all sold inverter units</p>
      </div>

      <SummaryCards cards={summaryCards} columns={4} />

      <FilterBar
        filters={filterConfigs}
        onFilterChange={handleFilterChange}
        showDateRange
        onDateRangeChange={handleDateRangeChange}
      />

      <DataTable<SoldInverter>
        columns={columns}
        data={inverters}
        isLoading={loading}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by serial #, invoice #, customer..."
        onExportCsv={handleExportCsv}
        emptyTitle="No sold inverters"
        emptyDescription="Sold inverters will appear here once sale invoices are created."
      />
    </div>
  );
}
