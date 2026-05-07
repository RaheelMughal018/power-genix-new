'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/_shared/components/ui/button/button';
import { Spinner } from '@/app/_shared/components/ui/spinner/spinner';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { InvoiceForm, type InvoiceLineItem, type ItemOption } from '@/app/_shared/components/forms/invoiceForm/invoiceForm';
import { purchaseInvoicesApi, suppliersApi, itemsApi } from '@/app/_shared/lib/api/client';
import { toLocalISO } from '@/app/_shared/lib/utils/date';
import { SearchableDropdown } from '@/app/_shared/components/ui/searchableDropdown/searchableDropdown';
import { DateInput } from '@/app/_shared/components/ui/dateInput/dateInput';
import { ROUTES } from '@/app/_shared/lib/config/routes';

interface SupplierOption { id: number; name: string; }

const emptyRow = (): InvoiceLineItem => ({
  id: typeof crypto !== 'undefined' ? crypto.randomUUID() : String(Date.now()),
  itemId: '', itemName: '', quantity: 1, unitPrice: 0, totalPrice: 0,
});

export default function CreatePurchaseInvoicePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [itemOptions, setItemOptions] = useState<ItemOption[]>([]);

  const [supplierId, setSupplierId] = useState<number>(0);
  const [date, setDate] = useState(toLocalISO(new Date()));
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([emptyRow()]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');

  const unwrapList = <T,>(res: { data: unknown }): T[] => {
    const raw = res.data as { data?: { data: T[] } } & { data: T[] };
    if (raw.data && Array.isArray((raw.data as { data?: T[] }).data)) return (raw.data as { data: T[] }).data;
    if (Array.isArray(raw.data)) return raw.data;
    return [];
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [supRes, itemRes] = await Promise.all([
          suppliersApi.getAll({ limit: 200 }),
          itemsApi.getAll({ limit: 200 }),
        ]);
        setSuppliers(unwrapList<SupplierOption>(supRes));
        const items = unwrapList<{ id: number; name: string; averagePrice?: number }>(itemRes);
        setItemOptions(items.map((i) => ({ id: String(i.id), name: i.name, avgPrice: i.averagePrice })));
      } catch {
        addToast({ title: 'Error', description: 'Failed to load data', variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async () => {
    if (!supplierId) {
      addToast({ title: 'Error', description: 'Select a supplier', variant: 'error' });
      return;
    }
    if (!date) {
      addToast({ title: 'Error', description: 'Select a date', variant: 'error' });
      return;
    }
    const validItems = lineItems.filter((l) => l.itemId && l.quantity > 0);
    if (validItems.length === 0) {
      addToast({ title: 'Error', description: 'Add at least one line item', variant: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      await purchaseInvoicesApi.create({
        supplierId, date, discount: discount || undefined, notes: notes || undefined,
        items: validItems.map((l) => ({ itemId: Number(l.itemId), quantity: l.quantity, unitPrice: l.unitPrice })),
      });
      addToast({ title: 'Success', description: 'Purchase invoice created', variant: 'success' });
      router.push(ROUTES.PURCHASE_INVOICES);
    } catch {
      addToast({ title: 'Error', description: 'Failed to create invoice', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-(--color-text-primary)">New Purchase Invoice</h1>
        <Button variant="outline" onClick={() => router.push(ROUTES.PURCHASE_INVOICES)}>Back</Button>
      </div>

      <div className="form-container space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <SearchableDropdown
            label="Supplier"
            required
            placeholder="Select supplier"
            value={supplierId || ''}
            onChange={(v) => setSupplierId(Number(v))}
            options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
          />

          <DateInput value={date} onChange={setDate} label="Date" required />
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-semibold text-(--color-text-primary)">Line Items</h3>
          <InvoiceForm
            lineItems={lineItems}
            onLineItemsChange={setLineItems}
            itemOptions={itemOptions}
            discount={discount}
            onDiscountChange={setDiscount}
            showDiscount
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-(--color-text-primary)">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-(--color-border) bg-(--color-bg-primary) text-(--color-text-primary) resize-none"
            placeholder="Optional notes..."
          />
        </div>

        <div className="flex gap-3">
          <Button variant="primary" onClick={handleSubmit} isLoading={submitting}>Create Invoice</Button>
          <Button variant="outline" onClick={() => router.push(ROUTES.PURCHASE_INVOICES)}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
