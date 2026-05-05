'use client';

import { useState, useEffect, useCallback } from 'react';
import { saleInvoicesApi, customersApi } from '@/app/_shared/lib/api/client';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { downloadCsv } from '@/app/_shared/lib/utils/download';

export interface SaleInvoice extends Record<string, unknown> {
  id: number;
  invoiceNumber: string;
  date: string;
  totalAmount: number;
  discount: number;
  grandTotal: number;
  notes?: string;
  customer: { id: number; name: string };
}

export interface CustomerOption {
  id: number;
  name: string;
}

interface SaleInvoicesResponse {
  data: SaleInvoice[];
  meta: { totalItems: number; currentPage: number; totalPages: number; itemsPerPage: number };
}

export function useSaleInvoices() {
  const { addToast } = useToast();
  const [invoices, setInvoices] = useState<SaleInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [customerId, setCustomerId] = useState<number | undefined>();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await customersApi.getAll({ limit: 200 });
      const raw = res.data as { data?: { data: CustomerOption[] } } & { data: CustomerOption[] };
      const list = raw.data && Array.isArray((raw.data as { data?: CustomerOption[] }).data)
        ? (raw.data as { data: CustomerOption[] }).data
        : Array.isArray(raw.data) ? raw.data : [];
      setCustomers(list);
    } catch {
      // non-critical
    }
  }, []);

  const fetchTotal = useCallback(async () => {
    try {
      const res = await saleInvoicesApi.getTotal();
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
      const response = await saleInvoicesApi.getAll({
        page, limit: 10,
        search: search || undefined,
        customerId: customerId || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      const raw = response.data as { data?: SaleInvoicesResponse } & SaleInvoicesResponse;
      const resData = raw.data && Array.isArray((raw.data as SaleInvoicesResponse).data)
        ? raw.data as SaleInvoicesResponse
        : raw;
      setInvoices(Array.isArray(resData.data) ? resData.data : []);
      setTotalPages(resData.meta?.totalPages ?? 1);
      setTotalItems(resData.meta?.totalItems ?? 0);
    } catch {
      addToast({ title: 'Error', description: 'Failed to load sale invoices', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, customerId, fromDate, toDate]);

  useEffect(() => { fetchCustomers(); fetchTotal(); }, []);
  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const handleExportCsv = async () => {
    try {
      await downloadCsv('/sale-invoices/export/csv', 'sale-invoices.csv');
    } catch {
      addToast({ title: 'Error', description: 'Export failed', variant: 'error' });
    }
  };

  return {
    invoices, loading, page, search, totalPages, totalItems,
    customerId, fromDate, toDate, customers, totalAmount,
    setPage,
    setSearch: (v: string) => { setSearch(v); setPage(1); },
    setCustomerId: (v: number | undefined) => { setCustomerId(v); setPage(1); },
    setFromDate: (v: string) => { setFromDate(v); setPage(1); },
    setToDate: (v: string) => { setToDate(v); setPage(1); },
    handleExportCsv,
    refetch: fetchInvoices,
  };
}
