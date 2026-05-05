'use client';

import { useState, useEffect, useCallback } from 'react';
import { soldInvertersApi, customersApi } from '@/app/_shared/lib/api/client';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { downloadCsv } from '@/app/_shared/lib/utils/download';

export interface CustomerOption extends Record<string, unknown> {
  id: number;
  name: string;
}

export interface SoldInverter extends Record<string, unknown> {
  id: number;
  serialNumber: string;
  itemName: string;
  customer: { id: number; name: string };
  productionCost: number;
  saleCost: number;
  profit: number;
}

export interface SoldInverterSummary {
  totalProductionCost: number;
  totalSaleCost: number;
  totalProfit: number;
}

interface ListResponse {
  data: SoldInverter[];
  meta: { totalItems: number; page: number; limit: number; totalPages: number };
}

const LIMIT = 20;

export function useSoldInverters() {
  const { addToast } = useToast();

  const [inverters, setInverters] = useState<SoldInverter[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [summary, setSummary] = useState<SoldInverterSummary>({
    totalProductionCost: 0,
    totalSaleCost: 0,
    totalProfit: 0,
  });

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [filterCustomerId, setFilterCustomerId] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await customersApi.getAll({ limit: 500 });
      const raw = res.data as { data?: { data: CustomerOption[] } } & { data: CustomerOption[] };
      const list = raw.data && Array.isArray((raw.data as { data?: unknown }).data)
        ? (raw.data as { data: CustomerOption[] }).data
        : (raw.data as unknown as CustomerOption[]) ?? [];
      setCustomers(Array.isArray(list) ? list : []);
    } catch {
      // non-critical
    }
  }, []);

  const fetchInverters = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.all([
        soldInvertersApi.getAll({
          page,
          limit: LIMIT,
          customerId: filterCustomerId ? Number(filterCustomerId) : undefined,
          fromDate: filterFromDate || undefined,
          toDate: filterToDate || undefined,
        }),
        soldInvertersApi.getSummary(),
      ]);

      const raw = listRes.data as { data?: ListResponse } & ListResponse;
      const resData = raw.data && Array.isArray((raw.data as { data?: unknown }).data)
        ? raw.data as ListResponse
        : (raw.data || raw) as ListResponse;
      setInverters(Array.isArray(resData.data) ? resData.data : []);
      setTotalPages(resData.meta?.totalPages ?? 1);
      setTotalItems(resData.meta?.totalItems ?? 0);

      const sumRaw = summaryRes.data as { data?: SoldInverterSummary } & SoldInverterSummary;
      const sumData = sumRaw.data && 'totalSaleCost' in sumRaw.data
        ? sumRaw.data as SoldInverterSummary
        : sumRaw as unknown as SoldInverterSummary;
      setSummary({
        totalProductionCost: sumData.totalProductionCost ?? 0,
        totalSaleCost: sumData.totalSaleCost ?? 0,
        totalProfit: sumData.totalProfit ?? 0,
      });
    } catch {
      addToast({ title: 'Error', description: 'Failed to load sold inverters', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, filterCustomerId, filterFromDate, filterToDate, addToast]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);
  useEffect(() => { fetchInverters(); }, [fetchInverters]);

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'customerId') setFilterCustomerId(value);
    setPage(1);
  };

  const handleDateRangeChange = (range: { from: string; to: string } | null) => {
    setFilterFromDate(range?.from ?? '');
    setFilterToDate(range?.to ?? '');
    setPage(1);
  };

  const handleExportCsv = async () => {
    try {
      await downloadCsv('/sold-inverters/export/csv', 'sold-inverters.csv');
    } catch {
      addToast({ title: 'Error', description: 'Failed to export CSV', variant: 'error' });
    }
  };

  return {
    inverters,
    loading,
    page,
    totalPages,
    totalItems,
    summary,
    customers,
    filterCustomerId,
    setPage,
    handleFilterChange,
    handleDateRangeChange,
    handleExportCsv,
  };
}
