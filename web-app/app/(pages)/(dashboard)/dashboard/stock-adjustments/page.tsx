'use client';

import { DataTable, type Column } from '@/app/_shared/components/ui/dataTable/dataTable';
import { ConfirmDialog } from '@/app/_shared/components/ui/confirmDialog/confirmDialog';
import { Button } from '@/app/_shared/components/ui/button/button';
import { AdjustmentForm } from './adjustmentForm';
import { useStockAdjustments, type StockAdjustment } from './useStockAdjustments';

const REASON_LABELS: Record<string, string> = {
  opening_stock: 'Opening Stock',
  miscount: 'Miscount',
  return_to_supplier: 'Return to Supplier',
  damaged_lost: 'Damaged / Lost',
};

export default function StockAdjustmentsPage() {
  const {
    items,
    suppliers,
    selectedItemInfo,
    itemInfoLoading,
    form,
    submitting,
    editingId,
    adjustments,
    historyLoading,
    page,
    totalPages,
    totalItems,
    deleteId,
    isDeleting,
    setPage,
    setDeleteId,
    handleExportCsv,
    handleItemChange,
    handleTypeChange,
    handleFieldChange,
    handleSubmit,
    handleEditClick,
    handleDeleteConfirm,
    resetForm,
  } = useStockAdjustments();

  const columns: Column<StockAdjustment>[] = [
    { key: 'id', label: 'ID', width: '60px' },
    {
      key: 'date',
      label: 'Date',
      width: '110px',
      render: (row) => row.date?.split('T')[0] ?? '—',
    },
    {
      key: 'item',
      label: 'Item',
      render: (row) => row.item?.name ?? '—',
    },
    {
      key: 'type',
      label: 'Type',
      width: '80px',
      render: (row) => (
        <span className={[
          'text-xs font-semibold px-2 py-0.5 rounded-full',
          row.type === 'add' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
        ].join(' ')}>
          {row.type === 'add' ? '+ Add' : '− Deduct'}
        </span>
      ),
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (row) => REASON_LABELS[row.reason] ?? row.reason,
    },
    {
      key: 'quantity',
      label: 'Qty',
      width: '80px',
      render: (row) => `${row.quantity} ${row.item?.unit ?? ''}`,
    },
    {
      key: 'unitPrice',
      label: 'Unit Price',
      width: '100px',
      render: (row) => row.unitPrice != null ? `Rs. ${Number(row.unitPrice).toFixed(2)}` : '—',
    },
    {
      key: 'supplier',
      label: 'Supplier',
      render: (row) => row.supplier?.name ?? '—',
    },
    {
      key: 'notes',
      label: 'Notes',
      render: (row) => row.notes ? (
        <span className="text-xs text-(--color-text-secondary) truncate max-w-[150px] block" title={String(row.notes)}>
          {String(row.notes)}
        </span>
      ) : '—',
    },
    {
      key: 'adjustedBy',
      label: 'By',
      render: (row) => row.adjustedBy
        ? `${row.adjustedBy.firstName} ${row.adjustedBy.lastName}`
        : '—',
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
          <Button size="sm" variant="danger" onClick={() => setDeleteId(row.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-(--color-text-primary)">Stock Adjustments</h1>
        <p className="text-(--color-text-secondary)">Manually add or deduct stock quantities</p>
      </div>

      <AdjustmentForm
        form={form}
        items={items}
        suppliers={suppliers}
        selectedItemInfo={selectedItemInfo}
        itemInfoLoading={itemInfoLoading}
        submitting={submitting}
        editingId={editingId}
        onItemChange={handleItemChange}
        onTypeChange={handleTypeChange}
        onFieldChange={handleFieldChange}
        onSubmit={handleSubmit}
        onCancel={resetForm}
      />

      <div>
        <h2 className="text-lg font-semibold text-(--color-text-primary) mb-3">Adjustment History</h2>
        <DataTable<StockAdjustment>
          columns={columns}
          data={adjustments}
          isLoading={historyLoading}
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={setPage}
          onExportCsv={handleExportCsv}
          emptyTitle="No adjustments yet"
          emptyDescription="Save your first adjustment above."
        />
      </div>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Adjustment"
        message="Are you sure you want to delete this adjustment? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
