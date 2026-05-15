'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/_shared/components/ui/button/button';
import { DateRangePicker } from '@/app/_shared/components/ui/dateRangePicker/dateRangePicker';
import { Input } from '@/app/_shared/components/ui/input/input';
import { NoContentCard } from '@/app/_shared/components/ui/noContentCard/noContentCard';
import { suppliersApi } from '@/app/_shared/lib/api/client';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { formatDate } from '@/app/_shared/lib/utils/date';
import { downloadPdf } from '@/app/_shared/lib/utils/download';
import { ROUTES } from '@/app/_shared/lib/config/routes';

interface StatementRow {
  id: number;
  type: 'invoice' | 'payment' | 'return';
  date: string;
  invoiceNumber: string;
  purchaseAmount: number;
  returnAmount: number;
  amountPaid: number;
  outstandingBalance: number;
}

interface StatementFooter {
  openingBalance: number;
  totalPurchase: number;
  totalReturns: number;
  totalPaid: number;
  outstanding: number;
}

interface StatementResponse {
  rows: StatementRow[];
  footer?: StatementFooter;
}

interface RawRow {
  id: number;
  type: 'invoice' | 'payment' | 'return';
  'Date': string;
  'Invoice #': string;
  'Purchase Amount': number;
  'Return Amount': number;
  'Amount Paid': number;
  'Outstanding Balance': number;
}

interface RawResponse {
  rows: RawRow[];
  footer?: {
    'Opening Balance': number;
    'Total Purchase': number;
    'Total Returns': number;
    'Total Paid': number;
    'Outstanding': number;
  };
}

interface Props { supplierId: number; }

const unwrapStatement = (res: { data: unknown }): StatementResponse => {
  const outer = res.data as { data: RawResponse };
  const raw = outer.data;
  const rows: StatementRow[] = (raw.rows ?? []).map((r) => ({
    id: r.id,
    type: r.type,
    date: r['Date'],
    invoiceNumber: r['Invoice #'],
    purchaseAmount: r['Purchase Amount'],
    returnAmount: r['Return Amount'] ?? 0,
    amountPaid: r['Amount Paid'],
    outstandingBalance: r['Outstanding Balance'],
  }));
  const footer = raw.footer ? {
    openingBalance: raw.footer['Opening Balance'],
    totalPurchase: raw.footer['Total Purchase'],
    totalReturns: raw.footer['Total Returns'] ?? 0,
    totalPaid: raw.footer['Total Paid'],
    outstanding: raw.footer['Outstanding'],
  } : undefined;
  return { rows, footer };
};

export function StatementTab({ supplierId }: Props) {
  const router = useRouter();
  const [statement, setStatement] = useState<StatementResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: string; to: string } | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [search, setSearch] = useState('');
  const [pickerKey, setPickerKey] = useState(0);

  const fetchStatement = useCallback(async (range: { from?: string; to?: string } = {}) => {
    setLoading(true);
    try {
      const res = await suppliersApi.getStatement(supplierId, range);
      setStatement(unwrapStatement(res));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    fetchStatement(dateRange ?? {});
  }, [fetchStatement, dateRange]);

  const handleDateChange = (range: { from: string; to: string } | null) => {
    setDateRange(range);
  };

  const handleClearFilters = () => {
    setSearch('');
    setDateRange(null);
    setPickerKey((k) => k + 1);
  };

  const hasFilter = Boolean(search) || Boolean(dateRange);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const params: Record<string, string> = {};
      if (dateRange?.from) params.from = dateRange.from;
      if (dateRange?.to) params.to = dateRange.to;
      await downloadPdf(`/suppliers/${supplierId}/statement/pdf`, `supplier-${supplierId}-statement.pdf`, params);
    } finally {
      setDownloading(false);
    }
  };

  const allRows = statement?.rows ?? [];
  const footer = statement?.footer;
  const term = search.trim().toLowerCase();
  const rows = term
    ? allRows.filter((r) => (r.invoiceNumber ?? '').toLowerCase().includes(term))
    : allRows;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-end flex-wrap gap-3 flex-1">
          <div className="w-full sm:w-72">
            <Input
              size="sm"
              placeholder="Search by invoice #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <DateRangePicker key={pickerKey} onChange={handleDateChange} />
          {hasFilter && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-sm text-(--color-primary) hover:underline cursor-pointer px-2 py-1"
            >
              Clear all
            </button>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={downloading}>
          {downloading ? 'Downloading...' : 'Download PDF'}
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <span className="text-(--color-text-secondary)">Loading...</span>
        </div>
      )}

      {!loading && rows.length === 0 && (
        <NoContentCard title="No statement data" description="No transactions found for the selected period." />
      )}

      {!loading && rows.length > 0 && (
        <div className="border border-(--color-border) rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-(--color-bg-secondary)">
              <tr>
                <th className="text-left px-4 py-3 text-(--color-text-secondary) font-medium">Date</th>
                <th className="text-left px-4 py-3 text-(--color-text-secondary) font-medium">Invoice #</th>
                <th className="text-right px-4 py-3 text-(--color-text-secondary) font-medium">Purchase Amount</th>
                <th className="text-right px-4 py-3 text-(--color-text-secondary) font-medium">Return Amount</th>
                <th className="text-right px-4 py-3 text-(--color-text-secondary) font-medium">Amount Paid</th>
                <th className="text-right px-4 py-3 text-(--color-text-secondary) font-medium">Outstanding Balance</th>
              </tr>
            </thead>
            <tbody>
              {footer && (
                <tr className="bg-(--color-bg-secondary)/30">
                  <td className="px-4 py-3 text-(--color-text-primary) italic">
                    {dateRange?.from ? formatDate(dateRange.from) : '-'}
                  </td>
                  <td className="px-4 py-3 font-medium text-(--color-text-primary)">Opening Balance</td>
                  <td className="px-4 py-3 text-right text-(--color-text-secondary)">-</td>
                  <td className="px-4 py-3 text-right text-(--color-text-secondary)">-</td>
                  <td className="px-4 py-3 text-right text-(--color-text-secondary)">-</td>
                  <td className="px-4 py-3 text-right font-medium text-(--color-text-primary)">{formatPKR(footer.openingBalance ?? 0)}</td>
                </tr>
              )}
              {rows.map((row, i) => (
                <tr key={i} className="border-t border-(--color-border)">
                  <td className="px-4 py-3 text-(--color-text-primary)">
                    {row.date ? formatDate(row.date) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {row.type === 'return' ? (
                      <span className="text-(--color-text-primary)">{row.invoiceNumber || '-'}</span>
                    ) : (
                      <button
                        type="button"
                        className="text-(--color-primary) hover:underline font-medium text-left cursor-pointer"
                        onClick={() => {
                          const route = row.type === 'invoice'
                            ? `${ROUTES.PURCHASE_INVOICES}/${row.id}`
                            : `${ROUTES.SUPPLIER_PAYMENTS}/${row.id}`;
                          router.push(route);
                        }}
                      >
                        {row.invoiceNumber || '-'}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-(--color-text-primary)">{formatPKR(row.purchaseAmount ?? 0)}</td>
                  <td className="px-4 py-3 text-right text-(--color-text-primary)">{formatPKR(row.returnAmount ?? 0)}</td>
                  <td className="px-4 py-3 text-right text-(--color-text-primary)">{formatPKR(row.amountPaid ?? 0)}</td>
                  <td className="px-4 py-3 text-right font-medium text-(--color-text-primary)">{formatPKR(row.outstandingBalance ?? 0)}</td>
                </tr>
              ))}
            </tbody>
            {footer && (
              <tfoot className="border-t-2 border-(--color-border) bg-(--color-bg-secondary)">
                <tr>
                  <td colSpan={2} className="px-4 py-3 font-semibold text-(--color-text-primary)">Total</td>
                  <td className="px-4 py-3 text-right font-semibold text-(--color-text-primary)">{formatPKR(footer.totalPurchase ?? 0)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-(--color-text-primary)">{formatPKR(footer.totalReturns ?? 0)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-(--color-text-primary)">{formatPKR(footer.totalPaid ?? 0)}</td>
                  <td className="px-4 py-3 text-right font-bold text-(--color-primary-600)">{formatPKR(footer.outstanding ?? 0)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
