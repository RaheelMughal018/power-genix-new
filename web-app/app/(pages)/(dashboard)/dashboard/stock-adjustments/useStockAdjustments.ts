'use client';

import { useState, useEffect, useCallback } from 'react';
import { stockAdjustmentsApi, itemsApi, suppliersApi } from '@/app/_shared/lib/api/client';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { toLocalISO } from '@/app/_shared/lib/utils/date';
import { downloadCsv } from '@/app/_shared/lib/utils/download';

export interface ItemOption extends Record<string, unknown> {
  id: number;
  name: string;
  unit?: string;
}

export interface SupplierOption extends Record<string, unknown> {
  id: number;
  name: string;
}

export interface ItemInfo {
  id: number;
  name: string;
  unit: string;
  totalQuantity: number;
  avgPrice: number;
  totalAmount: number;
}

interface RawItemInfo {
  id: number;
  name: string;
  unit: string;
  totalQuantity: number;
  averagePrice: number;
  totalValue: number;
}

export interface StockAdjustment extends Record<string, unknown> {
  id: number;
  date: string;
  type: 'add' | 'deduct';
  reason: string;
  quantity: number;
  unitPrice?: number;
  deductionAmount?: number | null;
  notes?: string;
  item: { id: number; name: string; unit: string };
  supplier?: { id: number; name: string };
  adjustedBy?: { firstName: string; lastName: string };
}

export interface AdjustmentFormValues {
  itemId: number | '';
  type: 'add' | 'deduct';
  reason: string;
  quantity: string;
  unitPrice: string;
  supplierId: number | '';
  notes: string;
  date: string;
}

const LIMIT = 20;
const today = () => toLocalISO(new Date());

const defaultForm = (): AdjustmentFormValues => ({
  itemId: '',
  type: 'add',
  reason: '',
  quantity: '',
  unitPrice: '',
  supplierId: '',
  notes: '',
  date: today(),
});

interface AdjustmentsListResponse {
  data: StockAdjustment[];
  meta: { totalItems: number; page: number; limit: number; totalPages: number };
}

export function useStockAdjustments() {
  const { addToast } = useToast();

  const [items, setItems] = useState<ItemOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [selectedItemInfo, setSelectedItemInfo] = useState<ItemInfo | null>(null);
  const [itemInfoLoading, setItemInfoLoading] = useState(false);

  const [form, setForm] = useState<AdjustmentFormValues>(defaultForm());
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const res = await itemsApi.getAll({ limit: 500 });
      const raw = res.data as { data?: { data: ItemOption[] } } & { data: ItemOption[] };
      const list = raw.data && Array.isArray((raw.data as { data?: unknown }).data)
        ? (raw.data as { data: ItemOption[] }).data
        : (raw.data as unknown as ItemOption[]) ?? [];
      setItems(Array.isArray(list) ? list : []);
    } catch {
      // non-critical
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await suppliersApi.getAll({ limit: 500 });
      const raw = res.data as { data?: { data: SupplierOption[] } } & { data: SupplierOption[] };
      const list = raw.data && Array.isArray((raw.data as { data?: unknown }).data)
        ? (raw.data as { data: SupplierOption[] }).data
        : (raw.data as unknown as SupplierOption[]) ?? [];
      setSuppliers(Array.isArray(list) ? list : []);
    } catch {
      // non-critical
    }
  }, []);

  const fetchAdjustments = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await stockAdjustmentsApi.getAll({ page, limit: LIMIT });
      const raw = res.data as { data?: AdjustmentsListResponse } & AdjustmentsListResponse;
      const resData = raw.data && Array.isArray((raw.data as { data?: unknown }).data)
        ? raw.data as AdjustmentsListResponse
        : (raw.data || raw) as AdjustmentsListResponse;
      setAdjustments(Array.isArray(resData.data) ? resData.data : []);
      setTotalPages(resData.meta?.totalPages ?? 1);
      setTotalItems(resData.meta?.totalItems ?? 0);
    } catch {
      addToast({ title: 'Error', description: 'Failed to load adjustment history', variant: 'error' });
    } finally {
      setHistoryLoading(false);
    }
  }, [page, addToast]);

  const fetchItemInfo = useCallback(async (itemId: number) => {
    setItemInfoLoading(true);
    setSelectedItemInfo(null);
    try {
      const res = await stockAdjustmentsApi.getItemInfo(itemId);
      const raw = (res.data as { data: RawItemInfo }).data;
      setSelectedItemInfo({
        id: raw.id,
        name: raw.name,
        unit: raw.unit,
        totalQuantity: raw.totalQuantity,
        avgPrice: raw.averagePrice,
        totalAmount: raw.totalValue,
      });
    } catch {
      // non-critical
    } finally {
      setItemInfoLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); fetchSuppliers(); }, [fetchItems, fetchSuppliers]);
  useEffect(() => { fetchAdjustments(); }, [fetchAdjustments]);

  useEffect(() => {
    if (!selectedItemInfo) return;
    setForm((prev) => {
      if (prev.reason !== 'return_to_supplier' || prev.unitPrice) return prev;
      return { ...prev, unitPrice: String(selectedItemInfo.avgPrice ?? '') };
    });
  }, [selectedItemInfo]);

  const handleItemChange = (itemId: number | '') => {
    setForm((prev) => ({ ...prev, itemId, reason: '' }));
    if (itemId) fetchItemInfo(itemId as number);
    else setSelectedItemInfo(null);
  };

  const handleTypeChange = (type: 'add' | 'deduct') => {
    setForm((prev) => ({ ...prev, type, reason: '', supplierId: '' }));
  };

  const handleFieldChange = <K extends keyof AdjustmentFormValues>(key: K, value: AdjustmentFormValues[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value } as AdjustmentFormValues;
      if (key === 'reason' && value === 'return_to_supplier' && !prev.unitPrice && selectedItemInfo) {
        next.unitPrice = String(selectedItemInfo.avgPrice ?? '');
      }
      return next;
    });
  };

  const resetForm = () => {
    setForm(defaultForm());
    setEditingId(null);
    setSelectedItemInfo(null);
  };

  const handleSubmit = async () => {
    if (!form.itemId || !form.reason || !form.quantity || !form.date) {
      addToast({ title: 'Validation', description: 'Fill all required fields', variant: 'error' });
      return;
    }
    const needsUnitPrice = form.type === 'add' || form.reason === 'return_to_supplier';
    if (needsUnitPrice && !form.unitPrice) {
      addToast({ title: 'Validation', description: 'Unit price is required', variant: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        itemId: form.itemId as number,
        quantity: parseFloat(form.quantity),
        unitPrice: form.unitPrice ? parseFloat(form.unitPrice) : undefined,
        type: form.type,
        reason: form.reason,
        supplierId: form.supplierId ? (form.supplierId as number) : undefined,
        notes: form.notes || undefined,
        date: form.date,
      };
      if (editingId) {
        await stockAdjustmentsApi.update(editingId, payload);
        addToast({ title: 'Adjustment updated', variant: 'success' });
      } else {
        await stockAdjustmentsApi.create(payload);
        addToast({ title: 'Adjustment saved', variant: 'success' });
      }
      resetForm();
      fetchAdjustments();
      if (form.itemId) fetchItemInfo(form.itemId as number);
    } catch {
      addToast({ title: 'Error', description: 'Failed to save adjustment', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (adj: StockAdjustment) => {
    setEditingId(adj.id);
    setForm({
      itemId: adj.item.id,
      type: adj.type,
      reason: adj.reason,
      quantity: String(adj.quantity),
      unitPrice: adj.unitPrice != null ? String(adj.unitPrice) : '',
      supplierId: adj.supplier?.id ?? '',
      notes: adj.notes ?? '',
      date: adj.date?.split('T')[0] ?? today(),
    });
    fetchItemInfo(adj.item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExportCsv = async () => {
    try {
      await downloadCsv('/stock-adjustments/export/csv', 'stock-adjustments.csv');
    } catch {
      addToast({ title: 'Error', description: 'Failed to export CSV', variant: 'error' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await stockAdjustmentsApi.remove(deleteId);
      addToast({ title: 'Adjustment deleted', variant: 'success' });
      setDeleteId(null);
      fetchAdjustments();
    } catch {
      addToast({ title: 'Error', description: 'Failed to delete adjustment', variant: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  return {
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
    handleItemChange,
    handleTypeChange,
    handleFieldChange,
    handleSubmit,
    handleEditClick,
    handleDeleteConfirm,
    handleExportCsv,
    resetForm,
  };
}
