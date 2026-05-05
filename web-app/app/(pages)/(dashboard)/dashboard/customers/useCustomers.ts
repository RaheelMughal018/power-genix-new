'use client';

import { useState, useEffect, useCallback } from 'react';
import { customersApi } from '@/app/_shared/lib/api/client';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { downloadCsv } from '@/app/_shared/lib/utils/download';
import type { Customer } from '@/app/_shared/lib/types/entities';

interface CustomersResponse {
  data: Customer[];
  meta: {
    totalItems: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const LIMIT = 10;

export function useCustomers() {
  const { addToast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await customersApi.getAll({ page, limit: LIMIT, search: search || undefined });
      const raw = response.data as { data?: CustomersResponse } & CustomersResponse;
      const resData = raw.data && 'data' in raw.data ? raw.data as CustomersResponse : raw;
      setCustomers(Array.isArray(resData.data) ? resData.data : []);
      setTotalPages(resData.meta?.totalPages ?? 1);
      setTotalItems(resData.meta?.totalItems ?? 0);
    } catch {
      addToast({ title: 'Error', description: 'Failed to load customers', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, addToast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleEditClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCustomer) return;
    setIsDeleting(true);
    try {
      await customersApi.remove(selectedCustomer.id);
      addToast({ title: 'Customer deleted', variant: 'success' });
      setIsDeleteDialogOpen(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch {
      addToast({ title: 'Error', description: 'Failed to delete customer', variant: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      await downloadCsv('/customers/export/csv', 'customers.csv');
    } catch {
      addToast({ title: 'Error', description: 'Failed to export CSV', variant: 'error' });
    }
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedCustomer(null);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedCustomer(null);
  };

  return {
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
  };
}
