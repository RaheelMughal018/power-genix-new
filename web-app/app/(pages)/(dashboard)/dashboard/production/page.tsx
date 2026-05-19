'use client';

import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/app/_shared/components/ui/dataTable/dataTable';
import { ConfirmDialog } from '@/app/_shared/components/ui/confirmDialog/confirmDialog';
import { Button } from '@/app/_shared/components/ui/button/button';
import { FilterBar } from '@/app/_shared/components/ui/filterBar/filterBar';
import { StatusBadge } from '@/app/_shared/components/ui/statusBadge/statusBadge';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { formatDate } from '@/app/_shared/lib/utils/date';
import { useProduction } from './useProduction';

export default function ProductionPage() {
  const router = useRouter();
  const {
    batches, loading, page, search, statusFilter, totalPages, totalItems,
    setPage, setSearch, setStatusFilter, isDeleteDialogOpen, setIsDeleteDialogOpen,
    isCancelDialogOpen, setIsCancelDialogOpen, isActioning,
    selectedBatch, setSelectedBatch, handleCancel, handleDelete,
  } = useProduction();

  const statusFilterConfig = [
    {
      key: 'status',
      label: 'Status',
      value: statusFilter,
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Completed', value: 'completed' },
      ],
    },
  ];

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'status') setStatusFilter(value);
  };

  const columns: Column<(typeof batches)[0]>[] = [
    {
      key: 'batchNumber',
      label: 'Batch #',
      render: (row) => (
        <button
          type="button"
          className="text-(--color-primary) hover:underline font-medium text-left cursor-pointer"
          onClick={() => router.push(`${ROUTES.PRODUCTION}/${row.id}`)}
        >
          {row.batchNumber}
        </button>
      ),
    },
    { key: 'recipe', label: 'Recipe/Product', render: (row) => row.recipe?.finalProduct?.name || row.recipe?.name || '-' },
    { key: 'quantity', label: 'Qty', render: (row) => String(row.quantity) },
    { key: 'productionDate', label: 'Production Date', render: (row) => row.productionDate ? formatDate(row.productionDate) : '-' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status as 'pending' | 'completed' | 'cancelled'} /> },
    { key: 'totalCost', label: 'Cost', render: (row) => formatPKR(row.totalCost) },
    { key: 'createdBy', label: 'Created By', render: (row) => row.createdBy ? `${row.createdBy.firstName} ${row.createdBy.lastName}` : '-' },
    {
      key: 'actions', label: 'Actions', width: '200px',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" onClick={() => router.push(`${ROUTES.PRODUCTION}/${row.id}`)}>View</Button>
          {row.status === 'pending' && (
            <>
              <Button size="sm" variant="outline" onClick={() => router.push(`${ROUTES.PRODUCTION}/${row.id}/edit`)}>Edit</Button>
              <Button size="sm" variant="danger" onClick={() => { setSelectedBatch(row); setIsCancelDialogOpen(true); }}>Cancel</Button>
            </>
          )}
          {(row.status === 'pending' || row.status === 'cancelled') && (
            <Button size="sm" variant="danger" onClick={() => { setSelectedBatch(row); setIsDeleteDialogOpen(true); }}>Delete</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-(--color-text-primary)">Production</h1>
          <p className="text-(--color-text-secondary)">Manage manufacturing batches</p>
        </div>
      </div>

      <FilterBar filters={statusFilterConfig} onFilterChange={handleFilterChange} />

      <DataTable
        columns={columns}
        data={batches}
        totalItems={totalItems}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={setSearch}
        isLoading={loading}
        actions={
          <Button variant="primary" onClick={() => router.push(ROUTES.PRODUCTION_CREATE)}>New Production</Button>
        }
        emptyTitle="No production batches yet"
        emptyDescription="Create your first production batch to get started."
        emptyAction={
          <Button size="sm" variant="primary" onClick={() => router.push(ROUTES.PRODUCTION_CREATE)}>New Production</Button>
        }
      />

      <ConfirmDialog
        isOpen={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        onConfirm={handleCancel}
        title="Cancel Batch"
        message={`Cancel batch "${selectedBatch?.batchNumber}"? This cannot be undone.`}
        confirmLabel="Cancel Batch"
        isLoading={isActioning}
        variant="warning"
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Batch"
        message={`Delete batch "${selectedBatch?.batchNumber}"?`}
        isLoading={isActioning}
      />
    </div>
  );
}
