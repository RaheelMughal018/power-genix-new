'use client';

import { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '@/app/_shared/lib/api/client';

export interface DashboardSummary {
  totalPurchaseCost: number;
  totalExpensesCost: number;
  totalInStockAmount: number;
  totalSalePrice: number;
  totalRepairCost: number;
  totalSoldInvertersProfit: number;
  totalAmountToPay: number;
  totalAmountToReceive: number;
  totalCurrentBalance: number;
  totalProductionCost: number;
  overallProfit: number;
  totalAssetAmount: number;
}

export interface DashboardCharts {
  months: string[];
  purchases: number[];
  sales: number[];
  expenses: number[];
  production: number[];
}

interface DateRange {
  from: string;
  to: string;
}

export const useDashboard = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  const fetchData = useCallback(async (range: DateRange | null) => {
    setLoading(true);
    try {
      const params = range ? { from: range.from, to: range.to } : undefined;

      const [summaryRes, chartsRes] = await Promise.all([
        dashboardApi.getSummary(params),
        dashboardApi.getCharts(params),
      ]);

      const summaryRaw = summaryRes.data as { data?: DashboardSummary } & DashboardSummary;
      const chartsRaw = chartsRes.data as { data?: DashboardCharts } & DashboardCharts;

      setSummary((summaryRaw.data || summaryRaw) as DashboardSummary);
      setCharts((chartsRaw.data || chartsRaw) as DashboardCharts);
    } catch {
      // silent — errors handled by api layer
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(dateRange);
  }, [dateRange, fetchData]);

  const handleDateChange = (range: DateRange | null) => {
    setDateRange(range);
  };

  return { summary, charts, loading, dateRange, handleDateChange };
};
