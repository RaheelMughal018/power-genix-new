'use client';

import { useDashboard } from '@/app/_shared/lib/hooks/useDashboard';
import { SummaryCards } from '@/app/_shared/components/ui/summaryCards/summaryCards';
import { DateRangePicker } from '@/app/_shared/components/ui/dateRangePicker/dateRangePicker';
import { DashboardChartsSection } from './dashboardCharts';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { ROUTES } from '@/app/_shared/lib/config/routes';

export default function DashboardPage() {
  const { summary, charts, loading, handleDateChange } = useDashboard();

  const cards = summary
    ? [
        {
          label: 'Total Purchases',
          value: formatPKR(summary.totalPurchaseCost),
          href: ROUTES.PURCHASE_INVOICES,
        },
        {
          label: 'Total Sales',
          value: formatPKR(summary.totalSalePrice),
          href: ROUTES.SALE_INVOICES,
        },
        {
          label: 'Total Expenses',
          value: formatPKR(summary.totalExpensesCost),
          href: ROUTES.EXPENSES,
        },
        {
          label: 'Total Repair Revenue',
          value: formatPKR(summary.totalRepairCost),
          href: ROUTES.REPAIR_INVOICES,
        },
        {
          label: 'Production Cost',
          value: formatPKR(summary.totalProductionCost),
          href: ROUTES.PRODUCTION,
        },
        {
          label: 'Stock Value',
          value: formatPKR(summary.totalInStockAmount),
          href: ROUTES.ITEMS,
        },
        {
          label: 'Sold Inverters Profit',
          value: formatPKR(summary.totalSoldInvertersProfit),
          href: ROUTES.SOLD_INVERTERS,
        },
        {
          label: 'Amount to Pay (Suppliers)',
          value: formatPKR(summary.totalAmountToPay),
          href: ROUTES.SUPPLIERS,
        },
        {
          label: 'Amount to Receive (Customers)',
          value: formatPKR(summary.totalAmountToReceive),
          href: ROUTES.CUSTOMERS,
        },
        {
          label: 'Current Bank Balance',
          value: formatPKR(summary.totalCurrentBalance),
          href: ROUTES.ACCOUNTS,
        },
        {
          label: 'Total Assets',
          value: formatPKR(summary.totalAssetAmount),
          href: ROUTES.ASSETS,
        },
        {
          label: 'Overall Profit',
          value: formatPKR(summary.overallProfit),
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Dashboard</h1>
          <p className="text-[var(--color-text-secondary)]">Business overview and analytics</p>
        </div>
        <DateRangePicker onChange={handleDateChange} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <SummaryCards cards={cards} columns={4} />
      )}

      {!loading && charts && charts.months.length > 0 && (
        <DashboardChartsSection charts={charts} />
      )}

      {!loading && charts && charts.months.length === 0 && (
        <div className="p-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-center text-[var(--color-text-secondary)]">
          No chart data available for the selected period.
        </div>
      )}
    </div>
  );
}
