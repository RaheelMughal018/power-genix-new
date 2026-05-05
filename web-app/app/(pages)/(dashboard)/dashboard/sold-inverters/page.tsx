'use client';

import { DataTable, type Column } from '@/app/_shared/components/ui/dataTable/dataTable';
import { SummaryCards } from '@/app/_shared/components/ui/summaryCards/summaryCards';
import { FilterBar } from '@/app/_shared/components/ui/filterBar/filterBar';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
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
    setPage,
    handleFilterChange,
    handleDateRangeChange,
    handleExportCsv,
  } = useSoldInverters();

  const summaryCards = [
    { label: 'Total Production Cost', value: formatPKR(summary.totalProductionCost) },
    { label: 'Total Sale Cost', value: formatPKR(summary.totalSaleCost) },
    { label: 'Total Profit', value: formatPKR(summary.totalProfit) },
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
      key: 'itemName',
      label: 'Item Name',
      render: (row) => row.itemName ?? '—',
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (row) => row.customer?.name ?? '—',
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

      <SummaryCards cards={summaryCards} columns={3} />

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
        onExportCsv={handleExportCsv}
        emptyTitle="No sold inverters"
        emptyDescription="Sold inverters will appear here once sale invoices are created."
      />
    </div>
  );
}
