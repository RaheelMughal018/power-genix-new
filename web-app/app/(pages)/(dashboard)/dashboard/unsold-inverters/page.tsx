'use client';

import { DataTable, type Column } from '@/app/_shared/components/ui/dataTable/dataTable';
import { SummaryCards } from '@/app/_shared/components/ui/summaryCards/summaryCards';
import { FilterBar } from '@/app/_shared/components/ui/filterBar/filterBar';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { formatDate } from '@/app/_shared/lib/utils/date';
import { useUnsoldInverters, type UnsoldInverter } from './useUnsoldInverters';

export default function UnsoldInvertersPage() {
  const {
    inverters,
    loading,
    page,
    totalPages,
    totalItems,
    summary,
    itemOptions,
    filterItemId,
    search,
    setPage,
    handleFilterChange,
    handleDateRangeChange,
    handleSearchChange,
    handleExportCsv,
  } = useUnsoldInverters();

  const summaryCards = [
    { label: 'Total Quantity', value: String(summary.totalQuantity) },
    { label: 'Total Production Cost', value: formatPKR(summary.totalProductionCost) },
  ];

  const itemFilterOptions = itemOptions.map((i) => ({ label: i.name, value: String(i.id) }));

  const filterConfigs = [
    { key: 'itemId', label: 'Item', options: itemFilterOptions, value: filterItemId },
  ];

  const columns: Column<UnsoldInverter>[] = [
    {
      key: 'serialNumber',
      label: 'Serial #',
      width: '160px',
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
      key: 'batch',
      label: 'Batch #',
      render: (row) => row.batch?.batchNumber ?? '—',
    },
    {
      key: 'productionDate',
      label: 'Production Date',
      render: (row) => row.batch?.productionDate ? formatDate(row.batch.productionDate) : '—',
    },
    {
      key: 'unitCost',
      label: 'Production Cost',
      render: (row) => formatPKR(row.unitCost),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-(--color-text-primary)">Unsold Inverters</h1>
        <p className="text-(--color-text-secondary)">View inverter units in stock awaiting sale</p>
      </div>

      <SummaryCards cards={summaryCards} columns={2} />

      <FilterBar
        filters={filterConfigs}
        onFilterChange={handleFilterChange}
        showDateRange
        onDateRangeChange={handleDateRangeChange}
      />

      <DataTable<UnsoldInverter>
        columns={columns}
        data={inverters}
        isLoading={loading}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by serial #, batch #, item name..."
        onExportCsv={handleExportCsv}
        emptyTitle="No unsold inverters"
        emptyDescription="Produced inverter units awaiting sale will appear here."
      />
    </div>
  );
}
