'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/app/_shared/components/ui/button/button';
import { Spinner } from '@/app/_shared/components/ui/spinner/spinner';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { repairInvoicesApi } from '@/app/_shared/lib/api/client';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { downloadPdf } from '@/app/_shared/lib/utils/download';

interface InvoiceItem {
  id: number;
  item: { id: number; name: string };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isReal: boolean;
}

interface InvoiceDetail {
  id: number;
  invoiceNumber: string;
  date: string;
  description: string;
  serialNumber?: string;
  isCharged: boolean;
  laborCost?: number;
  totalAmount: number;
  customer: { id: number; name: string };
  items: InvoiceItem[];
}

export default function ViewRepairInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await repairInvoicesApi.getById(id);
        const raw = res.data as { data?: InvoiceDetail } & InvoiceDetail;
        setInvoice((raw.data || raw) as InvoiceDetail);
      } catch {
        addToast({ title: 'Error', description: 'Failed to load invoice', variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!invoice) return <div className="text-center py-12 text-(--color-text-secondary)">Invoice not found.</div>;

  const partsTotal = (invoice.items || []).reduce((sum, li) => sum + li.totalPrice, 0);
  const laborCost = invoice.isCharged ? (invoice.laborCost || 0) : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <p className="text-sm text-(--color-text-secondary) uppercase tracking-wide">Repair Invoice</p>
            <span className={[
              'text-xs font-semibold px-2.5 py-0.5 rounded-full',
              invoice.isCharged
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-100 text-blue-700',
            ].join(' ')}>
              {invoice.isCharged ? 'Charged' : 'Free of Charge'}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-(--color-text-primary)">{invoice.invoiceNumber}</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={downloading}
            onClick={async () => {
              setDownloading(true);
              try {
                await downloadPdf(`/repair-invoices/${id}/pdf`, `${invoice?.invoiceNumber ?? 'RI'}.pdf`);
              } finally {
                setDownloading(false);
              }
            }}
          >
            <svg className="w-4 h-4 mr-1.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
            </svg>
            {downloading ? 'Downloading...' : 'Download PDF'}
          </Button>
          <Button variant="outline" onClick={() => router.push(`${ROUTES.REPAIR_INVOICES}/${id}/edit`)}>Edit</Button>
          <Button variant="outline" onClick={() => router.push(ROUTES.REPAIR_INVOICES)}>Back</Button>
        </div>
      </div>

      <div className="border-l-4 border-[var(--color-primary-500)] bg-(--color-bg-secondary) rounded-lg border border-(--color-border) p-6">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-[10px] text-(--color-text-secondary) uppercase tracking-widest font-medium mb-1">Invoice #</p>
            <p className="text-sm font-semibold text-(--color-text-primary)">{invoice.invoiceNumber}</p>
          </div>
          <div>
            <p className="text-[10px] text-(--color-text-secondary) uppercase tracking-widest font-medium mb-1">Date</p>
            <p className="text-sm font-semibold text-(--color-text-primary)">
              {invoice.date ? new Date(invoice.date).toLocaleDateString() : '-'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-(--color-text-secondary) uppercase tracking-widest font-medium mb-1">Customer</p>
            <p className="text-sm font-semibold text-(--color-text-primary)">{invoice.customer?.name || '-'}</p>
          </div>
          {invoice.serialNumber && (
            <div>
              <p className="text-[10px] text-(--color-text-secondary) uppercase tracking-widest font-medium mb-1">Serial / Product</p>
              <p className="text-sm font-mono font-semibold text-(--color-text-primary)">{invoice.serialNumber}</p>
            </div>
          )}
          <div className="col-span-2">
            <p className="text-[10px] text-(--color-text-secondary) uppercase tracking-widest font-medium mb-1">Description</p>
            <p className="text-sm text-(--color-text-primary)">{invoice.description}</p>
          </div>
        </div>
      </div>

      <div className="border border-(--color-border) rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-(--color-bg-secondary)">
            <tr>
              <th className="text-left px-4 py-3 text-(--color-text-secondary) font-semibold w-12">#</th>
              <th className="text-left px-4 py-3 text-(--color-text-secondary) font-semibold">Item</th>
              <th className="text-right px-4 py-3 text-(--color-text-secondary) font-semibold">Qty</th>
              <th className="text-right px-4 py-3 text-(--color-text-secondary) font-semibold">Unit Price</th>
              <th className="text-right px-4 py-3 text-(--color-text-secondary) font-semibold">Total</th>
              <th className="text-center px-4 py-3 text-(--color-text-secondary) font-semibold">Deduct Stock</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((li, idx) => (
              <tr key={li.id} className={[
                'border-t border-(--color-border)',
                idx % 2 === 1 ? 'bg-[var(--color-bg-tertiary)]' : '',
              ].filter(Boolean).join(' ')}>
                <td className="px-4 py-3 text-(--color-text-secondary)">{idx + 1}</td>
                <td className="px-4 py-3 text-(--color-text-primary)">{li.item?.name || '-'}</td>
                <td className="px-4 py-3 text-right text-(--color-text-primary)">{li.quantity}</td>
                <td className="px-4 py-3 text-right text-(--color-text-primary)">{formatPKR(li.unitPrice)}</td>
                <td className="px-4 py-3 text-right font-medium text-(--color-text-primary)">{formatPKR(li.totalPrice)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={['text-xs font-medium px-2 py-0.5 rounded-full', li.isReal ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'].join(' ')}>
                    {li.isReal ? 'Yes' : 'No'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <div className="w-72 bg-(--color-bg-secondary) rounded-lg border border-(--color-border) p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-(--color-text-secondary)">Parts Total</span>
            <span className="text-(--color-text-primary)">{formatPKR(partsTotal)}</span>
          </div>
          {invoice.isCharged && (
            <div className="flex justify-between text-sm">
              <span className="text-(--color-text-secondary)">Labor Cost</span>
              <span className="text-(--color-text-primary)">{formatPKR(laborCost)}</span>
            </div>
          )}
          <div className="border-t border-(--color-border) pt-3 mt-2 flex justify-between items-baseline">
            <span className="font-semibold text-(--color-text-primary)">Grand Total</span>
            <span className="text-xl font-bold text-(--color-primary-600)">
              {formatPKR(invoice.totalAmount ?? (partsTotal + laborCost))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
