'use client';

import { DataTable, type Column } from '@/app/_shared/components/ui/dataTable/dataTable';
import { ConfirmDialog } from '@/app/_shared/components/ui/confirmDialog/confirmDialog';
import { Button } from '@/app/_shared/components/ui/button/button';
import { SummaryCards } from '@/app/_shared/components/ui/summaryCards/summaryCards';
import { FilterBar } from '@/app/_shared/components/ui/filterBar/filterBar';
import { StatusBadge } from '@/app/_shared/components/ui/statusBadge/statusBadge';
import { ItemForm } from '@/app/_shared/components/forms/itemForm/itemForm';
import { formatPKR, formatNumber } from '@/app/_shared/lib/utils/currency';
import { downloadPdf } from '@/app/_shared/lib/utils/download';
import { useItems, type Item } from './useItems';

const ITEM_TYPE_LABELS: Record<string, string> = {
  raw_material: 'Raw Material',
  final_product: 'Final Product',
};

const TYPE_FILTER_OPTIONS = [
  { label: 'Raw Material', value: 'raw_material' },
  { label: 'Final Product', value: 'final_product' },
];

const STOCK_STATUS_OPTIONS = [
  { label: 'In Stock', value: 'in_stock' },
  { label: 'Out of Stock', value: 'out_of_stock' },
];

export default function ItemsPage() {
  const {
    items,
    loading,
    page,
    search,
    totalPages,
    totalItems,
    summary,
    categories,
    filterType,
    filterStockStatus,
    filterCategoryId,
    isCreateModalOpen,
    isEditModalOpen,
    isDeleteDialogOpen,
    isDeleting,
    selectedItem,
    setPage,
    handleSearchChange,
    handleFilterChange,
    handleEditClick,
    handleDeleteClick,
    handleDeleteConfirm,
    handleExportCsv,
    fetchItems,
    setIsCreateModalOpen,
    closeEditModal,
    closeDeleteDialog,
  } = useItems();

  const summaryCards = [
    { label: 'Total Stock Value', value: formatPKR(summary.totalStockValue) },
    { label: 'Total Units', value: formatNumber(summary.totalUnits) },
    { label: 'Total Items', value: formatNumber(summary.totalItems) },
  ];

  const categoryFilterOptions = categories.map((c) => ({ label: c.name, value: String(c.id) }));

  const filterConfigs = [
    { key: 'type', label: 'Type', options: TYPE_FILTER_OPTIONS, value: filterType },
    { key: 'stockStatus', label: 'Stock Status', options: STOCK_STATUS_OPTIONS, value: filterStockStatus },
    { key: 'categoryId', label: 'Category', options: categoryFilterOptions, value: filterCategoryId },
  ];

  const columns: Column<Item>[] = [
    { key: 'id', label: 'ID', width: '70px' },
    { key: 'name', label: 'Name', sortable: true },
    {
      key: 'category',
      label: 'Category',
      render: (row) => row.category?.name ?? '—',
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => ITEM_TYPE_LABELS[row.type] ?? row.type,
    },
    {
      key: 'unit',
      label: 'Unit',
      render: (row) => row.unit?.toUpperCase() ?? '—',
    },
    {
      key: 'averagePrice',
      label: 'Avg Price',
      render: (row) => formatPKR(Number(row.averagePrice)),
    },
    {
      key: 'totalQuantity',
      label: 'Total Qty',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span>{formatNumber(row.totalQuantity)}</span>
          {row.type === 'raw_material' && row.totalQuantity < 10 && (
            <StatusBadge status="low_stock" />
          )}
        </div>
      ),
    },
    {
      key: 'totalAmount',
      label: 'Total Amount',
      render: (row) => formatPKR(row.totalAmount),
    },
    {
      key: 'createdBy',
      label: 'Created By',
      render: (row) =>
        row.createdBy ? `${row.createdBy.firstName} ${row.createdBy.lastName}` : '—',
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '140px',
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEditClick(row)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDeleteClick(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-(--color-text-primary)">Items & Inventory</h1>
        <p className="text-(--color-text-secondary)">Manage raw materials and final products</p>
      </div>

      <SummaryCards cards={summaryCards} columns={3} />

      <FilterBar filters={filterConfigs} onFilterChange={handleFilterChange} />

      <DataTable<Item>
        columns={columns}
        data={items}
        isLoading={loading}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search items..."
        onExportCsv={handleExportCsv}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => downloadPdf('/items/pdf', 'items.pdf')}>
              Download PDF
            </Button>
            <Button size="sm" variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              Add Item
            </Button>
          </div>
        }
        emptyTitle="No items yet"
        emptyDescription="Add your first item to get started."
        emptyAction={
          <Button size="sm" variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            Add Item
          </Button>
        }
      />

      <ItemForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchItems}
        item={null}
        categories={categories}
      />

      <ItemForm
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSuccess={fetchItems}
        item={selectedItem}
        categories={categories}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Delete Item"
        message={`Are you sure you want to delete "${selectedItem?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
