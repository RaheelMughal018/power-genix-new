'use client';

import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/app/_shared/components/ui/dataTable/dataTable';
import { ConfirmDialog } from '@/app/_shared/components/ui/confirmDialog/confirmDialog';
import { Button } from '@/app/_shared/components/ui/button/button';
import { CustomerForm } from '@/app/_shared/components/forms/customerForm/customerForm';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import type { Customer } from '@/app/_shared/lib/types/entities';
import { useCustomers } from './useCustomers';

interface CustomerRow extends Customer, Record<string, unknown> {}

export default function CustomersPage() {
  const router = useRouter();
  const {
    customers,
    loading,
    page,
    search,
    totalPages,
    totalItems,
    isCreateModalOpen,
    isEditModalOpen,
    isDeleteDialogOpen,
    isDeleting,
    selectedCustomer,
    setPage,
    handleSearchChange,
    handleEditClick,
    handleDeleteClick,
    handleDeleteConfirm,
    handleExportCsv,
    fetchCustomers,
    setIsCreateModalOpen,
    closeEditModal,
    closeDeleteDialog,
  } = useCustomers();

  const columns: Column<CustomerRow>[] = [
    { key: 'id', label: 'ID', width: '80px' },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (row) => (
        <button
          type="button"
          className="text-(--color-primary) hover:underline font-medium text-left cursor-pointer"
          onClick={() => router.push(`${ROUTES.CUSTOMER_DETAIL}/${row.id}`)}
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
      key: 'totalSales',
      label: 'Total Sales (PKR)',
      render: (row) => formatPKR((row as CustomerRow & { totalSales?: number }).totalSales ?? 0),
    },
    {
      key: 'totalRepairs',
      label: 'Total Repairs (PKR)',
      render: (row) => formatPKR((row as CustomerRow & { totalRepairs?: number }).totalRepairs ?? 0),
    },
    {
      key: 'totalPayments',
      label: 'Total Payments (PKR)',
      render: (row) => formatPKR((row as CustomerRow & { totalPayments?: number }).totalPayments ?? 0),
    },
    {
      key: 'due',
      label: 'Due / Remaining (PKR)',
      render: (row) => formatPKR((row as CustomerRow & { due?: number }).due ?? 0),
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
          {(row as CustomerRow & { canDelete?: boolean }).canDelete && (
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
        <h1 className="text-2xl font-bold text-(--color-text-primary)">Customers</h1>
        <p className="text-(--color-text-secondary)">Manage your customers and their balances</p>
      </div>

      <DataTable<CustomerRow>
        columns={columns}
        data={customers as CustomerRow[]}
        isLoading={loading}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search customers..."
        onExportCsv={handleExportCsv}
        actions={
          <Button size="sm" variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            Add Customer
          </Button>
        }
        emptyTitle="No customers yet"
        emptyDescription="Add your first customer to get started."
        emptyAction={
          <Button size="sm" variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            Add Customer
          </Button>
        }
      />

      <CustomerForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchCustomers}
        customer={null}
      />

      <CustomerForm
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSuccess={fetchCustomers}
        customer={selectedCustomer}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Delete Customer"
        message={`Are you sure you want to delete "${selectedCustomer?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
