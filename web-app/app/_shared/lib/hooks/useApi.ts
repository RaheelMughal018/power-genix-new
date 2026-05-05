'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/app/_shared/components/ui/toast/toast';

interface UseApiOptions {
  immediate?: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    itemsPerPage: number;
    totalItems: number;
    currentPage: number;
    totalPages: number;
  };
}

export function useApi<T>(
  fetcher: () => Promise<{ data: { data: T } | T }>,
  options: UseApiOptions = { immediate: true },
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetcher();
      const resData = response.data as { data?: T } & T;
      setData(resData.data !== undefined ? resData.data : resData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      addToast({ title: 'Error', description: message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    if (options.immediate) {
      execute();
    }
  }, []);

  return { data, loading, error, refetch: execute, setData };
}

export function usePaginatedApi<T>(
  fetcher: (params: {
    page: number;
    limit: number;
    search?: string;
  }) => Promise<{ data: { data: PaginatedResponse<T> } | PaginatedResponse<T> }>,
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const { addToast } = useToast();

  const execute = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetcher({ page, limit: 10, search });
      const resData = response.data as { data?: PaginatedResponse<T> } & PaginatedResponse<T>;
      const paginated = resData.data || resData;
      setData(paginated.data);
      setTotalPages(paginated.meta.totalPages);
      setTotalItems(paginated.meta.totalItems);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      addToast({ title: 'Error', description: message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [fetcher, page, search]);

  useEffect(() => {
    execute();
  }, [page, search]);

  return {
    data,
    loading,
    page,
    totalPages,
    totalItems,
    search,
    setPage,
    setSearch,
    refetch: execute,
  };
}
