'use client';

import { useState, useEffect, useCallback } from 'react';
import { productionApi } from '@/app/_shared/lib/api/client';
import { useToast } from '@/app/_shared/components/ui/toast/toast';

interface BatchListItem extends Record<string, unknown> {
  id: number;
  batchNumber: string;
  recipe: { id: number; name: string; finalProduct: { name: string } };
  quantity: number;
  productionDate: string;
  status: string;
  totalCost: number;
  copperAmount: number;
  created_at: string;
  createdBy: { firstName: string; lastName: string };
}

interface BatchesResponse {
  data: BatchListItem[];
  meta: { totalItems: number; currentPage: number; totalPages: number };
}

export function useProduction() {
  const { addToast } = useToast();
  const [batches, setBatches] = useState<BatchListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isActioning, setIsActioning] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<BatchListItem | null>(null);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const response = await productionApi.getAll({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      const raw = response.data as { data?: BatchesResponse } & BatchesResponse;
      const resData = raw.data && Array.isArray((raw.data as BatchesResponse).data) ? raw.data as BatchesResponse : raw;
      setBatches(Array.isArray(resData.data) ? resData.data : []);
      setTotalPages(resData.meta?.totalPages ?? 1);
      setTotalItems(resData.meta?.totalItems ?? 0);
    } catch {
      addToast({ title: 'Error', description: 'Failed to load production batches', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, fromDate, toDate]);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  const handleComplete = async (id: number) => {
    setIsActioning(true);
    try {
      const res = await productionApi.complete(id);
      const raw = res.data as { data?: { success: boolean; shortfall?: unknown[] } } & { success?: boolean; shortfall?: unknown[] };
      const result = raw.data || raw;
      if ((result as { success?: boolean }).success === false) {
        addToast({ title: 'Insufficient Stock', description: 'Some items do not have enough stock', variant: 'warning' });
        return result;
      }
      addToast({ title: 'Success', description: 'Batch completed', variant: 'success' });
      fetchBatches();
      return result;
    } catch {
      addToast({ title: 'Error', description: 'Failed to complete batch', variant: 'error' });
    } finally {
      setIsActioning(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedBatch) return;
    setIsActioning(true);
    try {
      await productionApi.cancel(selectedBatch.id);
      addToast({ title: 'Success', description: 'Batch cancelled', variant: 'success' });
      setIsCancelDialogOpen(false);
      fetchBatches();
    } catch {
      addToast({ title: 'Error', description: 'Failed to cancel batch', variant: 'error' });
    } finally {
      setIsActioning(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBatch) return;
    setIsActioning(true);
    try {
      await productionApi.remove(selectedBatch.id);
      addToast({ title: 'Success', description: 'Batch deleted', variant: 'success' });
      setIsDeleteDialogOpen(false);
      fetchBatches();
    } catch {
      addToast({ title: 'Error', description: 'Failed to delete batch', variant: 'error' });
    } finally {
      setIsActioning(false);
    }
  };

  const setDateRange = (range: { from: string; to: string } | null) => {
    setFromDate(range?.from ?? '');
    setToDate(range?.to ?? '');
    setPage(1);
  };

  return {
    batches, loading, page, search, statusFilter, totalPages, totalItems,
    setPage, setSearch: (v: string) => { setSearch(v); setPage(1); },
    setStatusFilter: (v: string) => { setStatusFilter(v); setPage(1); },
    setDateRange,
    isDeleteDialogOpen, setIsDeleteDialogOpen, isCancelDialogOpen, setIsCancelDialogOpen,
    isActioning, selectedBatch, setSelectedBatch,
    handleComplete, handleCancel, handleDelete, refetch: fetchBatches,
  };
}
