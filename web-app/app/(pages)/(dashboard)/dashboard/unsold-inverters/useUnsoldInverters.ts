'use client';

import { useState, useEffect, useCallback } from 'react';
import { unsoldInvertersApi } from '@/app/_shared/lib/api/client';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { downloadCsv } from '@/app/_shared/lib/utils/download';

export interface UnsoldInverter extends Record<string, unknown> {
  id: number;
  serialNumber: string;
  unitCost: number;
  batch: { id: number; batchNumber: string; productionDate: string };
  item: { id: number; name: string };
}

export interface UnsoldInverterSummary {
  totalQuantity: number;
  totalProductionCost: number;
}

export interface UnsoldItemOption extends Record<string, unknown> {
  id: number;
  name: string;
}

interface ListResponse {
  data: UnsoldInverter[];
  meta: { totalItems: number; page: number; limit: number; totalPages: number };
}

const LIMIT = 20;

export function useUnsoldInverters() {
  const { addToast } = useToast();

  const [inverters, setInverters] = useState<UnsoldInverter[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [summary, setSummary] = useState<UnsoldInverterSummary>({
    totalQuantity: 0,
    totalProductionCost: 0,
  });

  const [itemOptions, setItemOptions] = useState<UnsoldItemOption[]>([]);
  const [filterItemId, setFilterItemId] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [search, setSearch] = useState('');

  const fetchItemOptions = useCallback(async () => {
    try {
      const res = await unsoldInvertersApi.getItems();
      const raw = res.data as { data?: UnsoldItemOption[] } & UnsoldItemOption[];
      const list = Array.isArray((raw as { data?: unknown }).data)
        ? (raw as { data: UnsoldItemOption[] }).data
        : (raw as unknown as UnsoldItemOption[]) ?? [];
      setItemOptions(Array.isArray(list) ? list : []);
    } catch {
      // non-critical
    }
  }, []);

  const fetchInverters = useCallback(async () => {
    setLoading(true);
    try {
      const filterParams = {
        search: search || undefined,
        itemId: filterItemId ? Number(filterItemId) : undefined,
        fromDate: filterFromDate || undefined,
        toDate: filterToDate || undefined,
      };
      const [listRes, summaryRes] = await Promise.all([
        unsoldInvertersApi.getAll({ page, limit: LIMIT, ...filterParams }),
        unsoldInvertersApi.getSummary(filterParams),
      ]);

      const raw = listRes.data as { data?: ListResponse } & ListResponse;
      const resData = raw.data && Array.isArray((raw.data as { data?: unknown }).data)
        ? raw.data as ListResponse
        : (raw.data || raw) as ListResponse;
      setInverters(Array.isArray(resData.data) ? resData.data : []);
      setTotalPages(resData.meta?.totalPages ?? 1);
      setTotalItems(resData.meta?.totalItems ?? 0);

      const sumRaw = summaryRes.data as { data?: UnsoldInverterSummary } & UnsoldInverterSummary;
      const sumData = sumRaw.data && 'totalQuantity' in sumRaw.data
        ? sumRaw.data as UnsoldInverterSummary
        : sumRaw as unknown as UnsoldInverterSummary;
      setSummary({
        totalQuantity: sumData.totalQuantity ?? 0,
        totalProductionCost: sumData.totalProductionCost ?? 0,
      });
    } catch {
      addToast({ title: 'Error', description: 'Failed to load unsold inverters', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, filterItemId, filterFromDate, filterToDate, addToast]);

  useEffect(() => { fetchItemOptions(); }, [fetchItemOptions]);
  useEffect(() => { fetchInverters(); }, [fetchInverters]);

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'itemId') setFilterItemId(value);
    setPage(1);
  };

  const handleDateRangeChange = (range: { from: string; to: string } | null) => {
    setFilterFromDate(range?.from ?? '');
    setFilterToDate(range?.to ?? '');
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleExportCsv = async () => {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (filterItemId) params.itemId = filterItemId;
      if (filterFromDate) params.fromDate = filterFromDate;
      if (filterToDate) params.toDate = filterToDate;
      await downloadCsv('/unsold-inverters/export/csv', 'unsold-inverters.csv', params);
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
    itemOptions,
    filterItemId,
    search,
    setPage,
    handleFilterChange,
    handleDateRangeChange,
    handleSearchChange,
    handleExportCsv,
  };
}
