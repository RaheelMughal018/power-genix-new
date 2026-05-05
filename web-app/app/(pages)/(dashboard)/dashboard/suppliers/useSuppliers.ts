'use client';

import { useState, useEffect, useCallback } from 'react';
import { suppliersApi } from '@/app/_shared/lib/api/client';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { downloadCsv } from '@/app/_shared/lib/utils/download';
import type { Supplier } from '@/app/_shared/lib/types/entities';

interface SuppliersResponse {
  data: Supplier[];
  meta: {
    totalItems: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const LIMIT = 10;

export function useSuppliers() {
  const { addToast } = useToast();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await suppliersApi.getAll({ page, limit: LIMIT, search: search || undefined });
      const raw = response.data as { data?: SuppliersResponse } & SuppliersResponse;
      const resData = raw.data && 'data' in raw.data ? raw.data as SuppliersResponse : raw;
      setSuppliers(Array.isArray(resData.data) ? resData.data : []);
      setTotalPages(resData.meta?.totalPages ?? 1);
      setTotalItems(resData.meta?.totalItems ?? 0);
    } catch {
      addToast({ title: 'Error', description: 'Failed to load suppliers', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, addToast]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleEditClick = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSupplier) return;
    setIsDeleting(true);
    try {
      await suppliersApi.remove(selectedSupplier.id);
      addToast({ title: 'Supplier deleted', variant: 'success' });
      setIsDeleteDialogOpen(false);
      setSelectedSupplier(null);
      fetchSuppliers();
    } catch {
      addToast({ title: 'Error', description: 'Failed to delete supplier', variant: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      await downloadCsv('/suppliers/export/csv', 'suppliers.csv');
    } catch {
      addToast({ title: 'Error', description: 'Failed to export CSV', variant: 'error' });
    }
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedSupplier(null);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedSupplier(null);
  };

  return {
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
  };
}
