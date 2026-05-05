'use client';

import { useState, useEffect, useCallback } from 'react';
import { accountsApi } from '@/app/_shared/lib/api/client';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { downloadCsv } from '@/app/_shared/lib/utils/download';
import type { Account } from '@/app/_shared/lib/types/entities';

interface AccountsResponse {
  data: Account[];
  meta: {
    totalItems: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface TotalBalanceResponse {
  totalBalance: number;
}

const LIMIT = 10;

export function useAccounts() {
  const { addToast } = useToast();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isOpeningBalanceModalOpen, setIsOpeningBalanceModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const [accountsRes, balanceRes] = await Promise.all([
        accountsApi.getAll({ page, limit: LIMIT, search: search || undefined }),
        accountsApi.getTotalBalance(),
      ]);
      const raw = accountsRes.data as { data?: AccountsResponse } & AccountsResponse;
      const resData = raw.data && 'data' in raw.data ? raw.data as AccountsResponse : raw;
      setAccounts(Array.isArray(resData.data) ? resData.data : []);
      setTotalPages(resData.meta?.totalPages ?? 1);
      setTotalItems(resData.meta?.totalItems ?? 0);
      const balRaw = balanceRes.data as { data?: TotalBalanceResponse } & TotalBalanceResponse;
      const balData = balRaw.data && 'totalBalance' in balRaw.data ? balRaw.data : balRaw;
      setTotalBalance(balData.totalBalance ?? 0);
    } catch {
      addToast({ title: 'Error', description: 'Failed to load accounts', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, addToast]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleEditClick = (account: Account) => {
    setSelectedAccount(account);
    setIsEditModalOpen(true);
  };

  const handleOpeningBalanceClick = (account: Account) => {
    setSelectedAccount(account);
    setIsOpeningBalanceModalOpen(true);
  };

  const handleDeleteClick = (account: Account) => {
    setSelectedAccount(account);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAccount) return;
    if (selectedAccount.currentBalance !== 0) {
      addToast({
        title: 'Cannot delete',
        description: 'Account balance must be zero before deleting.',
        variant: 'error',
      });
      return;
    }
    setIsDeleting(true);
    try {
      await accountsApi.remove(selectedAccount.id);
      addToast({ title: 'Account deleted', variant: 'success' });
      setIsDeleteDialogOpen(false);
      setSelectedAccount(null);
      fetchAccounts();
    } catch {
      addToast({ title: 'Error', description: 'Failed to delete account', variant: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      await downloadCsv('/accounts/export/csv', 'accounts.csv');
    } catch {
      addToast({ title: 'Error', description: 'Failed to export CSV', variant: 'error' });
    }
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedAccount(null);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedAccount(null);
  };

  const closeOpeningBalanceModal = () => {
    setIsOpeningBalanceModalOpen(false);
    setSelectedAccount(null);
  };

  return {
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
  };
}
