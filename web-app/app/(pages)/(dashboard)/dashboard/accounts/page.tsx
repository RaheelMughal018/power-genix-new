'use client';

import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/app/_shared/components/ui/dataTable/dataTable';
import { ConfirmDialog } from '@/app/_shared/components/ui/confirmDialog/confirmDialog';
import { Button } from '@/app/_shared/components/ui/button/button';
import { AccountForm } from '@/app/_shared/components/forms/accountForm/accountForm';
import { OpeningBalanceForm } from '@/app/_shared/components/forms/openingBalanceForm/openingBalanceForm';
import { TransferForm } from '@/app/_shared/components/forms/transferForm/transferForm';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import type { Account as AccountEntity } from '@/app/_shared/lib/types/entities';
import { useAccounts } from './useAccounts';

interface Account extends AccountEntity, Record<string, unknown> {}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank: 'Bank',
  mobile_wallet: 'Mobile Wallet',
};

export default function AccountsPage() {
  const router = useRouter();
  const {
    accounts,
    loading,
    page,
    search,
    totalPages,
    totalItems,
    totalBalance,
    isCreateModalOpen,
    isEditModalOpen,
    isDeleteDialogOpen,
    isOpeningBalanceModalOpen,
    isTransferModalOpen,
    isDeleting,
    selectedAccount,
    setPage,
    handleSearchChange,
    handleEditClick,
    handleOpeningBalanceClick,
    handleDeleteClick,
    handleDeleteConfirm,
    handleExportCsv,
    fetchAccounts,
    setIsCreateModalOpen,
    setIsTransferModalOpen,
    closeEditModal,
    closeDeleteDialog,
    closeOpeningBalanceModal,
  } = useAccounts();

  const columns: Column<Account>[] = [
    { key: 'id', label: 'ID', width: '80px' },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (row) => (
        <button
          type="button"
          className="text-(--color-primary) hover:underline font-medium text-left cursor-pointer"
          onClick={() => router.push(`${ROUTES.ACCOUNT_DETAIL}/${row.id}`)}
        >
          {row.name}
        </button>
      ),
    },
    {
      key: 'type',
      label: 'Account Type',
      render: (row) => ACCOUNT_TYPE_LABELS[row.type] ?? row.type,
    },
    {
      key: 'openingBalance',
      label: 'Opening Balance (PKR)',
      render: (row) => formatPKR(row.openingBalance),
    },
    {
      key: 'currentBalance',
      label: 'Current Balance (PKR)',
      render: (row) => formatPKR(row.currentBalance),
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
      width: '220px',
      render: (row) => (
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => handleEditClick(row)}>
            Edit
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleOpeningBalanceClick(row)}>
            Opening Bal.
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteClick(row)}
            disabled={row.currentBalance !== 0}
            title={row.currentBalance !== 0 ? 'Balance must be zero to delete' : undefined}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const footerRow = (
    <tr>
      <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-(--color-text-primary)">
        Total Balance
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-(--color-text-primary)">
        {formatPKR(totalBalance)}
      </td>
      <td colSpan={2} />
    </tr>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-(--color-text-primary)">Accounts</h1>
        <p className="text-(--color-text-secondary)">Manage cash, bank and mobile wallet accounts</p>
      </div>

      <DataTable<Account>
        columns={columns}
        data={accounts as Account[]}
        isLoading={loading}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search accounts..."
        onExportCsv={handleExportCsv}
        footerRow={accounts.length > 0 ? footerRow : undefined}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsTransferModalOpen(true)}>
              Transfer
            </Button>
            <Button size="sm" variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              Add Account
            </Button>
          </div>
        }
        emptyTitle="No accounts yet"
        emptyDescription="Add your first account to get started."
        emptyAction={
          <Button size="sm" variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            Add Account
          </Button>
        }
      />

      <AccountForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchAccounts}
        account={null}
      />

      <AccountForm
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSuccess={fetchAccounts}
        account={selectedAccount}
      />

      <OpeningBalanceForm
        isOpen={isOpeningBalanceModalOpen}
        onClose={closeOpeningBalanceModal}
        onSuccess={fetchAccounts}
        account={selectedAccount}
      />

      <TransferForm
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSuccess={fetchAccounts}
        accounts={accounts.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          currentBalance: a.currentBalance,
        }))}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Delete Account"
        message={`Are you sure you want to delete "${selectedAccount?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
