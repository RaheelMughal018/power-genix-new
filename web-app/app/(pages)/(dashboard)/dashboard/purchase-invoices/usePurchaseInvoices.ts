'use client';

import { useState, useEffect, useCallback } from 'react';
import { purchaseInvoicesApi, suppliersApi } from '@/app/_shared/lib/api/client';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { downloadCsv } from '@/app/_shared/lib/utils/download';

export interface PurchaseInvoice extends Record<string, unknown> {
  id: number;
  invoiceNumber: string;
  date: string;
  totalAmount: number;
  discount: number;
  grandTotal: number;
  notes?: string;
  supplier: { id: number; name: string };
}

export interface SupplierOption {
  id: number;
  name: string;
}

interface PurchaseInvoicesResponse {
  data: PurchaseInvoice[];
  meta: { totalItems: number; currentPage: number; totalPages: number; itemsPerPage: number };
}

export function usePurchaseInvoices() {
  const { addToast } = useToast();
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [supplierId, setSupplierId] = useState<number | undefined>();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await suppliersApi.getAll({ limit: 200 });
      const raw = res.data as { data?: { data: SupplierOption[] } } & { data: SupplierOption[] };
      const list = raw.data && Array.isArray((raw.data as { data?: SupplierOption[] }).data)
        ? (raw.data as { data: SupplierOption[] }).data
        : Array.isArray(raw.data) ? raw.data : [];
      setSuppliers(list);
    } catch {
      // non-critical
    }
  }, []);

  const fetchTotal = useCallback(async () => {
    try {
      const res = await purchaseInvoicesApi.getTotal();
      const raw = res.data as { data?: { total: number } } & { total?: number };
      const total = (raw.data as { total?: number })?.total ?? raw.total ?? 0;
      setTotalAmount(total);
    } catch {
      // non-critical
    }
  }, []);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await purchaseInvoicesApi.getAll({
        page, limit: 10,
        search: search || undefined,
        supplierId: supplierId || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      const raw = response.data as { data?: PurchaseInvoicesResponse } & PurchaseInvoicesResponse;
      const resData = raw.data && Array.isArray((raw.data as PurchaseInvoicesResponse).data)
        ? raw.data as PurchaseInvoicesResponse
        : raw;
      setInvoices(Array.isArray(resData.data) ? resData.data : []);
      setTotalPages(resData.meta?.totalPages ?? 1);
      setTotalItems(resData.meta?.totalItems ?? 0);
    } catch {
      addToast({ title: 'Error', description: 'Failed to load purchase invoices', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, supplierId, fromDate, toDate]);

  useEffect(() => { fetchSuppliers(); fetchTotal(); }, []);
  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const handleExportCsv = async () => {
    try {
      await downloadCsv('/purchase-invoices/export/csv', 'purchase-invoices.csv');
    } catch {
      addToast({ title: 'Error', description: 'Export failed', variant: 'error' });
    }
  };

  return {
    invoices, loading, page, search, totalPages, totalItems,
    supplierId, fromDate, toDate, suppliers, totalAmount,
    setPage,
    setSearch: (v: string) => { setSearch(v); setPage(1); },
    setSupplierId: (v: number | undefined) => { setSupplierId(v); setPage(1); },
    setFromDate: (v: string) => { setFromDate(v); setPage(1); },
    setToDate: (v: string) => { setToDate(v); setPage(1); },
    handleExportCsv,
    refetch: fetchInvoices,
  };
}
