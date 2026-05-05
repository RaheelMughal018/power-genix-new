'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/app/_shared/components/ui/button/button';
import { Spinner } from '@/app/_shared/components/ui/spinner/spinner';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { purchaseInvoicesApi } from '@/app/_shared/lib/api/client';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { downloadPdf } from '@/app/_shared/lib/utils/download';

interface InvoiceItem {
  id: number;
  item: { id: number; name: string };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface InvoiceDetail {
  id: number;
  invoiceNumber: string;
  date: string;
  discount: number;
  totalAmount: number;
  grandTotal: number;
  notes?: string;
  supplier: { id: number; name: string };
  items: InvoiceItem[];
}

export default function ViewPurchaseInvoicePage() {
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
        const res = await purchaseInvoicesApi.getById(id);
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

  const subtotal = (invoice.items || []).reduce((sum, li) => sum + li.totalPrice, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-(--color-text-secondary) uppercase tracking-wide mb-1">Purchase Invoice</p>
          <h1 className="text-3xl font-bold text-(--color-text-primary)">{invoice.invoiceNumber}</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={downloading}
            onClick={async () => {
              setDownloading(true);
              try {
                await downloadPdf(`/purchase-invoices/${id}/pdf`, `${invoice?.invoiceNumber ?? 'PI'}.pdf`);
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
          <Button variant="outline" onClick={() => router.push(`${ROUTES.PURCHASE_INVOICES}/${id}/edit`)}>Edit</Button>
          <Button variant="outline" onClick={() => router.push(ROUTES.PURCHASE_INVOICES)}>Back</Button>
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
            <p className="text-[10px] text-(--color-text-secondary) uppercase tracking-widest font-medium mb-1">Supplier</p>
            <p className="text-sm font-semibold text-(--color-text-primary)">{invoice.supplier?.name || '-'}</p>
          </div>
          {invoice.notes && (
            <div className="col-span-3">
              <p className="text-[10px] text-(--color-text-secondary) uppercase tracking-widest font-medium mb-1">Notes</p>
              <p className="text-sm text-(--color-text-primary)">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>

      <div className="border border-(--color-border) rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-primary-50)]">
            <tr>
              <th className="text-left px-4 py-3 text-(--color-text-secondary) font-semibold w-12">#</th>
              <th className="text-left px-4 py-3 text-(--color-text-secondary) font-semibold">Item</th>
              <th className="text-right px-4 py-3 text-(--color-text-secondary) font-semibold">Qty</th>
              <th className="text-right px-4 py-3 text-(--color-text-secondary) font-semibold">Unit Price</th>
              <th className="text-right px-4 py-3 text-(--color-text-secondary) font-semibold">Total</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <div className="w-72 bg-(--color-bg-secondary) rounded-lg border border-(--color-border) p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-(--color-text-secondary)">Subtotal</span>
            <span className="text-(--color-text-primary)">{formatPKR(subtotal)}</span>
          </div>
          {(invoice.discount ?? 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-(--color-text-secondary)">Discount</span>
              <span className="text-(--color-text-primary)">- {formatPKR(invoice.discount)}</span>
            </div>
          )}
          <div className="border-t border-(--color-border) pt-3 mt-2 flex justify-between items-baseline">
            <span className="font-semibold text-(--color-text-primary)">Grand Total</span>
            <span className="text-xl font-bold text-(--color-primary-600)">
              {formatPKR(invoice.grandTotal ?? invoice.totalAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
