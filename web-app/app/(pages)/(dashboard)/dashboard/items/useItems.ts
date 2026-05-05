'use client';

import { useState, useEffect, useCallback } from 'react';
import { itemsApi, categoriesApi } from '@/app/_shared/lib/api/client';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { downloadCsv } from '@/app/_shared/lib/utils/download';

interface ItemCategory {
  id: number;
  name: string;
}

interface ItemCreatedBy {
  firstName: string;
  lastName: string;
}

export interface Item extends Record<string, unknown> {
  id: number;
  name: string;
  type: string;
  unit: string;
  averagePrice: number;
  totalQuantity: number;
  totalAmount: number;
  category: ItemCategory;
  categoryId?: number;
  createdBy: ItemCreatedBy;
}

interface ItemsResponse {
  data: Item[];
  meta: {
    totalItems: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface ItemSummary {
  totalStockValue: number;
  totalUnits: number;
  totalItems: number;
}

interface CategoryOption {
  id: number;
  name: string;
}

interface CategoriesResponse {
  data: CategoryOption[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const LIMIT = 10;

export function useItems() {
  const { addToast } = useToast();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [summary, setSummary] = useState<ItemSummary>({ totalStockValue: 0, totalUnits: 0, totalItems: 0 });
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [filterType, setFilterType] = useState('');
  const [filterStockStatus, setFilterStockStatus] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoriesApi.getAll({ limit: 200 });
      const raw = res.data as { data?: CategoriesResponse } & CategoriesResponse;
      const resData = raw.data && 'data' in raw.data ? raw.data as CategoriesResponse : raw;
      setCategories(Array.isArray(resData.data) ? resData.data : []);
    } catch {
      // non-critical
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: Parameters<typeof itemsApi.getAll>[0] = {
        page,
        limit: LIMIT,
        search: search || undefined,
        type: filterType || undefined,
        stockStatus: filterStockStatus || undefined,
        categoryId: filterCategoryId ? Number(filterCategoryId) : undefined,
      };
      const [itemsRes, summaryRes] = await Promise.all([
        itemsApi.getAll(params),
        itemsApi.getSummary(),
      ]);

      const raw = itemsRes.data as { data?: ItemsResponse } & ItemsResponse;
      const resData = raw.data && 'data' in raw.data ? raw.data as ItemsResponse : raw;
      setItems(Array.isArray(resData.data) ? resData.data : []);
      setTotalPages(resData.meta?.totalPages ?? 1);
      setTotalItems(resData.meta?.totalItems ?? 0);

      const sumRaw = summaryRes.data as { data?: ItemSummary } & ItemSummary;
      const sumData = sumRaw.data && 'totalItems' in sumRaw.data ? sumRaw.data as ItemSummary : sumRaw;
      setSummary({
        totalStockValue: sumData.totalStockValue ?? 0,
        totalUnits: sumData.totalUnits ?? 0,
        totalItems: sumData.totalItems ?? 0,
      });
    } catch {
      addToast({ title: 'Error', description: 'Failed to load items', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, filterType, filterStockStatus, filterCategoryId, addToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'type') setFilterType(value);
    if (key === 'stockStatus') setFilterStockStatus(value);
    if (key === 'categoryId') setFilterCategoryId(value);
    setPage(1);
  };

  const handleEditClick = (item: Item) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (item: Item) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;
    setIsDeleting(true);
    try {
      await itemsApi.remove(selectedItem.id);
      addToast({ title: 'Item deleted', variant: 'success' });
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
      fetchItems();
    } catch {
      addToast({ title: 'Error', description: 'Failed to delete item', variant: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      await downloadCsv('/items/export/csv', 'items.csv');
    } catch {
      addToast({ title: 'Error', description: 'Failed to export CSV', variant: 'error' });
    }
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedItem(null);
  };

  return {
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
  };
}
