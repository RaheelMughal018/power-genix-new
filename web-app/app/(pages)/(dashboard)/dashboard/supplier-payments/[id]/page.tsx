'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/_shared/components/ui/button/button';
import { Spinner } from '@/app/_shared/components/ui/spinner/spinner';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { supplierPaymentsApi } from '@/app/_shared/lib/api/client';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import { formatPKR } from '@/app/_shared/lib/utils/currency';

interface PaymentDetail {
  id: number;
  invoiceNumber: string;
  amount: number;
  date: string;
  notes: string | null;
  supplier: { id: number; name: string };
  account: { id: number; name: string };
}

export default function ViewSupplierPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<PaymentDetail | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await supplierPaymentsApi.getById(Number(id));
        const detail = (res.data as { data: PaymentDetail }).data;
        setPayment(detail);
      } catch {
        addToast({ title: 'Error', description: 'Failed to load payment', variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, addToast]);

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!payment) return <div className="text-center py-12 text-(--color-text-secondary)">Payment not found.</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-(--color-text-secondary) uppercase tracking-wide mb-1">Supplier Payment</p>
          <h1 className="text-3xl font-bold text-(--color-text-primary)">{payment.invoiceNumber}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`${ROUTES.SUPPLIER_PAYMENTS}/${id}/edit`)}>Edit</Button>
          <Button variant="outline" onClick={() => router.push(ROUTES.SUPPLIER_PAYMENTS)}>Back</Button>
        </div>
      </div>

      <div className="border-l-4 border-[var(--color-primary-500)] bg-(--color-bg-secondary) rounded-lg border border-(--color-border) p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-[10px] text-(--color-text-secondary) uppercase tracking-widest font-medium mb-1">Invoice #</p>
            <p className="text-sm font-semibold text-(--color-text-primary)">{payment.invoiceNumber}</p>
          </div>
          <div>
            <p className="text-[10px] text-(--color-text-secondary) uppercase tracking-widest font-medium mb-1">Date</p>
            <p className="text-sm font-semibold text-(--color-text-primary)">
              {new Date(payment.date).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-(--color-text-secondary) uppercase tracking-widest font-medium mb-1">Supplier</p>
            <button
              type="button"
              className="text-sm font-semibold text-(--color-primary) hover:underline cursor-pointer"
              onClick={() => router.push(`${ROUTES.SUPPLIER_DETAIL}/${payment.supplier?.id}`)}
            >
              {payment.supplier?.name || '-'}
            </button>
          </div>
          <div>
            <p className="text-[10px] text-(--color-text-secondary) uppercase tracking-widest font-medium mb-1">Account</p>
            <button
              type="button"
              className="text-sm font-semibold text-(--color-primary) hover:underline cursor-pointer"
              onClick={() => router.push(`${ROUTES.ACCOUNT_DETAIL}/${payment.account?.id}`)}
            >
              {payment.account?.name || '-'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <div className="w-72 bg-(--color-bg-secondary) rounded-lg border border-(--color-border) p-4">
          <div className="flex justify-between items-baseline">
            <span className="font-semibold text-(--color-text-primary)">Amount Paid</span>
            <span className="text-xl font-bold text-(--color-primary-600)">{formatPKR(payment.amount)}</span>
          </div>
        </div>
      </div>

      {payment.notes && (
        <div className="bg-(--color-bg-secondary) rounded-lg border border-(--color-border) p-4">
          <p className="text-[10px] text-(--color-text-secondary) uppercase tracking-widest font-medium mb-1">Notes</p>
          <p className="text-sm text-(--color-text-primary)">{payment.notes}</p>
        </div>
      )}
    </div>
  );
}
