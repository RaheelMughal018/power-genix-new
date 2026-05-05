'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/_shared/components/ui/button/button';
import { Spinner } from '@/app/_shared/components/ui/spinner/spinner';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { saleInvoicesApi, customersApi, itemsApi } from '@/app/_shared/lib/api/client';
import { SearchableDropdown } from '@/app/_shared/components/ui/searchableDropdown/searchableDropdown';
import { DateInput } from '@/app/_shared/components/ui/dateInput/dateInput';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import { SaleLineItems, type SaleLineItem, type ItemOption } from './saleLineItems';

interface CustomerOption { id: number; name: string; }

const emptyRow = (): SaleLineItem => ({
  id: typeof crypto !== 'undefined' ? crypto.randomUUID() : String(Date.now()),
  itemId: '', itemName: '', itemType: '', quantity: 1, unitPrice: 0, totalPrice: 0,
});

export default function CreateSaleInvoicePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [itemOptions, setItemOptions] = useState<ItemOption[]>([]);

  const [customerId, setCustomerId] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [lineItems, setLineItems] = useState<SaleLineItem[]>([emptyRow()]);
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
        const [custRes, itemRes] = await Promise.all([
          customersApi.getAll({ limit: 200 }),
          itemsApi.getAll({ limit: 200 }),
        ]);
        setCustomers(unwrapList<CustomerOption>(custRes));
        const items = unwrapList<{ id: number; name: string; type: string; averagePrice?: number }>(itemRes);
        setItemOptions(items.map((i) => ({ id: String(i.id), name: i.name, type: i.type, avgPrice: i.averagePrice })));
      } catch {
        addToast({ title: 'Error', description: 'Failed to load data', variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async () => {
    if (!customerId) {
      addToast({ title: 'Error', description: 'Select a customer', variant: 'error' });
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
      await saleInvoicesApi.create({
        customerId, date, discount: discount || undefined, notes: notes || undefined,
        items: validItems.map((l) => ({
          itemId: Number(l.itemId),
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          serialNumber: l.serialNumber || undefined,
        })),
      });
      addToast({ title: 'Success', description: 'Sale invoice created', variant: 'success' });
      router.push(ROUTES.SALE_INVOICES);
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
        <h1 className="text-2xl font-bold text-(--color-text-primary)">New Sale Invoice</h1>
        <Button variant="outline" onClick={() => router.push(ROUTES.SALE_INVOICES)}>Back</Button>
      </div>

      <div className="form-container space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <SearchableDropdown
            label="Customer"
            required
            placeholder="Select customer"
            value={customerId || ''}
            onChange={(v) => setCustomerId(Number(v))}
            options={customers.map((c) => ({ value: c.id, label: c.name }))}
          />

          <DateInput value={date} onChange={setDate} label="Date" required />
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-semibold text-(--color-text-primary)">Line Items</h3>
          <SaleLineItems
            lineItems={lineItems}
            onLineItemsChange={setLineItems}
            itemOptions={itemOptions}
            discount={discount}
            onDiscountChange={setDiscount}
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
          <Button variant="outline" onClick={() => router.push(ROUTES.SALE_INVOICES)}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
