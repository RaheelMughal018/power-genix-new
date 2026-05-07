'use client';

import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/app/_shared/components/ui/dataTable/dataTable';
import { ConfirmDialog } from '@/app/_shared/components/ui/confirmDialog/confirmDialog';
import { Button } from '@/app/_shared/components/ui/button/button';
import { SupplierForm } from '@/app/_shared/components/forms/supplierForm/supplierForm';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import type { Supplier } from '@/app/_shared/lib/types/entities';
import { useSuppliers } from './useSuppliers';

interface SupplierRow extends Supplier, Record<string, unknown> {}

export default function SuppliersPage() {
  const router = useRouter();
  const {
    suppliers,
    loading,
    page,
    search,
    totalPages,
    totalItems,
    isCreateModalOpen,
    isEditModalOpen,
    isDeleteDialogOpen,
    isDeleting,
    selectedSupplier,
    setPage,
    handleSearchChange,
    handleEditClick,
    handleDeleteClick,
    handleDeleteConfirm,
    handleExportCsv,
    fetchSuppliers,
    setIsCreateModalOpen,
    closeEditModal,
    closeDeleteDialog,
  } = useSuppliers();

  const columns: Column<SupplierRow>[] = [
    { key: 'id', label: 'ID', width: '80px' },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (row) => (
        <button
          type="button"
          className="text-(--color-primary) hover:underline font-medium text-left cursor-pointer"
          onClick={() => router.push(`${ROUTES.SUPPLIER_DETAIL}/${row.id}`)}
        >
          {row.name}
        </button>
      ),
    },
    {
      key: 'openingBalance',
      label: 'Opening Balance (PKR)',
      render: (row) => formatPKR(row.openingBalance),
    },
    {
      key: 'totalPurchase',
      label: 'Total Purchase (PKR)',
      render: (row) => formatPKR((row as SupplierRow & { totalPurchase?: number }).totalPurchase ?? 0),
    },
    {
      key: 'totalPaid',
      label: 'Total Paid (PKR)',
      render: (row) => formatPKR((row as SupplierRow & { totalPaid?: number }).totalPaid ?? 0),
    },
    {
      key: 'due',
      label: 'Due / Remaining (PKR)',
      render: (row) => formatPKR((row as SupplierRow & { due?: number }).due ?? 0),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '160px',
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEditClick(row)}>
            Edit
          </Button>
          {(row as SupplierRow & { canDelete?: boolean }).canDelete && (
            <Button size="sm" variant="danger" onClick={() => handleDeleteClick(row)}>
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-(--color-text-primary)">Suppliers</h1>
        <p className="text-(--color-text-secondary)">Manage your suppliers and their balances</p>
      </div>

      <DataTable<SupplierRow>
        columns={columns}
        data={suppliers as SupplierRow[]}
        isLoading={loading}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search suppliers..."
        onExportCsv={handleExportCsv}
        actions={
          <Button size="sm" variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            Add Supplier
          </Button>
        }
        emptyTitle="No suppliers yet"
        emptyDescription="Add your first supplier to get started."
        emptyAction={
          <Button size="sm" variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            Add Supplier
          </Button>
        }
      />

      <SupplierForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchSuppliers}
        supplier={null}
      />

      <SupplierForm
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSuccess={fetchSuppliers}
        supplier={selectedSupplier}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Delete Supplier"
        message={`Are you sure you want to delete "${selectedSupplier?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
