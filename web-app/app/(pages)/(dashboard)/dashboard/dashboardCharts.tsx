'use client';

import dynamic from 'next/dynamic';
import type { DashboardCharts } from '@/app/_shared/lib/hooks/useDashboard';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface DashboardChartsProps {
  charts: DashboardCharts;
}

export const DashboardChartsSection = ({ charts }: DashboardChartsProps) => {
  const lineOptions: ApexCharts.ApexOptions = {
    chart: { type: 'line', toolbar: { show: false }, zoom: { enabled: false } },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: { categories: charts.months },
    legend: { position: 'top' },
    colors: ['#3b82f6', '#10b981'],
    tooltip: { y: { formatter: (val) => `Rs. ${val.toLocaleString()}` } },
    responsive: [{ breakpoint: 768, options: { chart: { height: 220 } } }],
  };

  const barOptions: ApexCharts.ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
    xaxis: { categories: charts.months },
    colors: ['#f59e0b'],
    tooltip: { y: { formatter: (val) => `Rs. ${val.toLocaleString()}` } },
    responsive: [{ breakpoint: 768, options: { chart: { height: 220 } } }],
  };

  const lineSeries = [
    { name: 'Purchases', data: charts.purchases },
    { name: 'Sales', data: charts.sales },
  ];

  const barSeries = [{ name: 'Expenses', data: charts.expenses }];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="p-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] shadow-sm">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-4">
          Purchases vs Sales
        </h3>
        <Chart type="line" series={lineSeries} options={lineOptions} height={280} width="100%" />
      </div>

      <div className="p-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] shadow-sm">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-4">
          Monthly Expenses
        </h3>
        <Chart type="bar" series={barSeries} options={barOptions} height={280} width="100%" />
      </div>
    </div>
  );
};
