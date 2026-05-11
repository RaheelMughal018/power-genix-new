'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/_shared/components/ui/button/button';
import { DateRangePicker } from '@/app/_shared/components/ui/dateRangePicker/dateRangePicker';
import { NoContentCard } from '@/app/_shared/components/ui/noContentCard/noContentCard';
import { customersApi } from '@/app/_shared/lib/api/client';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { formatDate } from '@/app/_shared/lib/utils/date';
import { downloadPdf } from '@/app/_shared/lib/utils/download';
import { ROUTES } from '@/app/_shared/lib/config/routes';

interface StatementRow {
  id: number;
  type: 'sale' | 'repair' | 'repair_foc' | 'payment';
  date: string;
  invoiceNumber: string;
  saleAmount: number;
  repairAmount: number;
  amountReceived: number;
  outstandingBalance: number;
}

interface StatementFooter {
  openingBalance: number;
  totalSale: number;
  totalRepair: number;
  totalReceived: number;
  outstanding: number;
}

interface StatementResponse {
  rows: StatementRow[];
  footer?: StatementFooter;
}

interface RawRow {
  id: number;
  type: 'sale' | 'repair' | 'payment';
  'Date': string;
  'Invoice #': string;
  'Sale Amount': number;
  'Repair Amount': number;
  'Amount Received': number;
  'Outstanding Balance': number;
}

interface RawResponse {
  rows: RawRow[];
  footer?: {
    'Opening Balance': number;
    'Total Sale': number;
    'Total Repair': number;
    'Total Received': number;
    'Outstanding': number;
  };
}

interface Props { customerId: number; }

const unwrapStatement = (res: { data: unknown }): StatementResponse => {
  const outer = res.data as { data: RawResponse };
  const raw = outer.data;
  const rows: StatementRow[] = (raw.rows ?? []).map((r) => ({
    id: r.id,
    type: r.type,
    date: r['Date'],
    invoiceNumber: r['Invoice #'],
    saleAmount: r['Sale Amount'],
    repairAmount: r['Repair Amount'],
    amountReceived: r['Amount Received'],
    outstandingBalance: r['Outstanding Balance'],
  }));
  const footer = raw.footer ? {
    openingBalance: raw.footer['Opening Balance'],
    totalSale: raw.footer['Total Sale'],
    totalRepair: raw.footer['Total Repair'],
    totalReceived: raw.footer['Total Received'],
    outstanding: raw.footer['Outstanding'],
  } : undefined;
  return { rows, footer };
};

export function CustomerStatementTab({ customerId }: Props) {
  const router = useRouter();
  const [statement, setStatement] = useState<StatementResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: string; to: string } | null>(null);
  const [downloading, setDownloading] = useState(false);

  const fetchStatement = useCallback(async (range: { from?: string; to?: string } = {}) => {
    setLoading(true);
    try {
      const res = await customersApi.getStatement(customerId, range);
      setStatement(unwrapStatement(res));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchStatement(dateRange ?? {});
  }, [fetchStatement, dateRange]);

  const handleDateChange = (range: { from: string; to: string } | null) => {
    setDateRange(range);
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const params: Record<string, string> = {};
      if (dateRange?.from) params.from = dateRange.from;
      if (dateRange?.to) params.to = dateRange.to;
      await downloadPdf(`/customers/${customerId}/statement/pdf`, `customer-${customerId}-statement.pdf`, params);
    } finally {
      setDownloading(false);
    }
  };

  const rows = statement?.rows ?? [];
  const footer = statement?.footer;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <DateRangePicker onChange={handleDateChange} />
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
                <th className="text-right px-4 py-3 text-(--color-text-secondary) font-medium">Sale Amount</th>
                <th className="text-right px-4 py-3 text-(--color-text-secondary) font-medium">Repair Amount</th>
                <th className="text-right px-4 py-3 text-(--color-text-secondary) font-medium">Amount Received</th>
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
                    <span className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        className="text-(--color-primary) hover:underline font-medium text-left cursor-pointer"
                        onClick={() => {
                          const route = row.type === 'sale'
                            ? `${ROUTES.SALE_INVOICES}/${row.id}`
                            : row.type === 'repair' || row.type === 'repair_foc'
                              ? `${ROUTES.REPAIR_INVOICES}/${row.id}`
                              : `${ROUTES.CUSTOMER_PAYMENTS}/${row.id}`;
                          router.push(route);
                        }}
                      >
                        {row.invoiceNumber || '-'}
                      </button>
                      {row.type === 'repair_foc' && (
                        <span className="inline-block px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded bg-(--color-warning-50) text-(--color-warning-600) border border-(--color-warning-500)">FOC</span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-(--color-text-primary)">{formatPKR(row.saleAmount ?? 0)}</td>
                  <td className="px-4 py-3 text-right text-(--color-text-primary)">{formatPKR(row.repairAmount ?? 0)}</td>
                  <td className="px-4 py-3 text-right text-(--color-text-primary)">{formatPKR(row.amountReceived ?? 0)}</td>
                  <td className="px-4 py-3 text-right font-medium text-(--color-text-primary)">{formatPKR(row.outstandingBalance ?? 0)}</td>
                </tr>
              ))}
            </tbody>
            {footer && (
              <tfoot className="border-t-2 border-(--color-border) bg-(--color-bg-secondary)">
                <tr>
                  <td colSpan={2} className="px-4 py-3 font-semibold text-(--color-text-primary)">Total</td>
                  <td className="px-4 py-3 text-right font-semibold text-(--color-text-primary)">{formatPKR(footer.totalSale ?? 0)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-(--color-text-primary)">{formatPKR(footer.totalRepair ?? 0)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-(--color-text-primary)">{formatPKR(footer.totalReceived ?? 0)}</td>
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
