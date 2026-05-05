'use client';

import { useState, useEffect, useCallback } from 'react';
import { customerPaymentsApi, customersApi, accountsApi } from '@/app/_shared/lib/api/client';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { downloadCsv } from '@/app/_shared/lib/utils/download';

export interface CustomerPayment extends Record<string, unknown> {
  id: number;
  invoiceNumber?: string;
  date: string;
  amount: number;
  notes?: string;
  customer: { id: number; name: string };
  account: { id: number; name: string };
  createdBy?: { firstName: string; lastName?: string };
}

export interface CustomerOption { id: number; name: string; }
export interface AccountOption { id: number; name: string; balance?: number; }

interface PaymentsResponse {
  data: CustomerPayment[];
  meta: { totalItems: number; currentPage: number; totalPages: number; itemsPerPage: number };
}

const unwrapList = <T,>(res: { data: unknown }): T[] => {
  const raw = res.data as { data?: { data: T[] } } & { data: T[] };
  if (raw.data && Array.isArray((raw.data as { data?: T[] }).data)) return (raw.data as { data: T[] }).data;
  if (Array.isArray(raw.data)) return raw.data;
  return [];
};

export function useCustomerPayments() {
  const { addToast } = useToast();
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [customerId, setCustomerId] = useState<number | undefined>();
  const [accountId, setAccountId] = useState<number | undefined>();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  const fetchDropdowns = useCallback(async () => {
    try {
      const [cusRes, accRes] = await Promise.all([
        customersApi.getAll({ limit: 200 }),
        accountsApi.getAll({ limit: 200 }),
      ]);
      setCustomers(unwrapList<CustomerOption>(cusRes));
      setAccounts(unwrapList<AccountOption>(accRes));
    } catch {
      // non-critical
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await customerPaymentsApi.getAll({
        page, limit: 10,
        search: search || undefined,
        customerId: customerId || undefined,
        accountId: accountId || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      const raw = response.data as { data?: PaymentsResponse } & PaymentsResponse;
      const resData = raw.data && Array.isArray((raw.data as PaymentsResponse).data)
        ? raw.data as PaymentsResponse
        : raw;
      const list = Array.isArray(resData.data) ? resData.data : [];
      setPayments(list);
      setTotalPages(resData.meta?.totalPages ?? 1);
      setTotalItems(resData.meta?.totalItems ?? 0);
      setTotalAmount(list.reduce((sum, p) => sum + (p.amount ?? 0), 0));
    } catch {
      addToast({ title: 'Error', description: 'Failed to load customer payments', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, customerId, accountId, fromDate, toDate]);

  useEffect(() => { fetchDropdowns(); }, []);
  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handleExportCsv = async () => {
    try {
      await downloadCsv('/customer-payments/export/csv', 'customer-payments.csv');
    } catch {
      addToast({ title: 'Error', description: 'Export failed', variant: 'error' });
    }
  };

  return {
    payments, loading, page, search, totalPages, totalItems,
    customerId, accountId, fromDate, toDate, customers, accounts, totalAmount,
    setPage,
    setSearch: (v: string) => { setSearch(v); setPage(1); },
    setCustomerId: (v: number | undefined) => { setCustomerId(v); setPage(1); },
    setAccountId: (v: number | undefined) => { setAccountId(v); setPage(1); },
    setFromDate: (v: string) => { setFromDate(v); setPage(1); },
    setToDate: (v: string) => { setToDate(v); setPage(1); },
    handleExportCsv,
    refetch: fetchPayments,
  };
}
