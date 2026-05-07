'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/app/_shared/components/ui/button/button';
import { Spinner } from '@/app/_shared/components/ui/spinner/spinner';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { saleInvoicesApi, customersApi, itemsApi } from '@/app/_shared/lib/api/client';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import { SearchableDropdown } from '@/app/_shared/components/ui/searchableDropdown/searchableDropdown';
import { DateInput } from '@/app/_shared/components/ui/dateInput/dateInput';
import { SaleLineItems, type SaleLineItem, type ItemOption } from '../../create/saleLineItems';

interface CustomerOption { id: number; name: string; }

interface InvoiceDetail {
  id: number;
  date: string;
  discount: number;
  notes?: string;
  customer: { id: number; name: string };
  items: Array<{
    id: number;
    item: { id: number; name: string; type: string };
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    serialNumber?: string;
  }>;
}

export default function EditSaleInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [itemOptions, setItemOptions] = useState<ItemOption[]>([]);

  const [customerId, setCustomerId] = useState<number>(0);
  const [date, setDate] = useState('');
  const [lineItems, setLineItems] = useState<SaleLineItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');

  const unwrapList = <T,>(res: { data: unknown }): T[] => {
    const raw = res.data as { data?: { data: T[] } } & { data: T[] };
    if (raw.data && Array.isArray((raw.data as { data?: T[] }).data)) return (raw.data as { data: T[] }).data;
    if (Array.isArray(raw.data)) return raw.data;
    return [];
  };

  const unwrapOne = <T,>(res: { data: unknown }): T => {
    const raw = res.data as { data?: T } & T;
    return (raw.data || raw) as T;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [custRes, itemRes, invRes] = await Promise.all([
          customersApi.getAll({ limit: 200 }),
          itemsApi.getAll({ limit: 200 }),
          saleInvoicesApi.getById(id),
        ]);
        setCustomers(unwrapList<CustomerOption>(custRes));
        const items = unwrapList<{ id: number; name: string; type: string; averagePrice?: number }>(itemRes);
        setItemOptions(items.map((i) => ({ id: String(i.id), name: i.name, type: i.type, avgPrice: i.averagePrice })));

        const inv = unwrapOne<InvoiceDetail>(invRes);
        setCustomerId(inv.customer?.id || 0);
        setDate(inv.date?.slice(0, 10) || '');
        setDiscount(inv.discount || 0);
        setNotes(inv.notes || '');
        setLineItems((inv.items || []).map((li) => ({
          id: String(li.id),
          itemId: String(li.item.id),
          itemName: li.item.name,
          itemType: li.item.type || '',
          quantity: Number(li.quantity),
          unitPrice: Number(li.unitPrice),
          totalPrice: Number(li.totalPrice),
          serialNumber: li.serialNumber,
        })));
      } catch {
        addToast({ title: 'Error', description: 'Failed to load invoice', variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

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
      await saleInvoicesApi.update(id, {
        customerId, date, discount: discount || undefined, notes: notes || undefined,
        items: validItems.map((l) => ({
          itemId: Number(l.itemId),
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          serialNumber: l.serialNumber || undefined,
        })),
      });
      addToast({ title: 'Success', description: 'Sale invoice updated', variant: 'success' });
      router.push(`${ROUTES.SALE_INVOICES}/${id}`);
    } catch {
      addToast({ title: 'Error', description: 'Failed to update invoice', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-(--color-text-primary)">Edit Sale Invoice</h1>
        <Button variant="outline" onClick={() => router.push(`${ROUTES.SALE_INVOICES}/${id}`)}>Back</Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SearchableDropdown
          label="Customer"
          required
          value={customerId || ''}
          onChange={(v) => setCustomerId(Number(v))}
          options={customers.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Select customer"
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
        <Button variant="primary" onClick={handleSubmit} isLoading={submitting}>Save Changes</Button>
        <Button variant="outline" onClick={() => router.push(`${ROUTES.SALE_INVOICES}/${id}`)}>Cancel</Button>
      </div>
    </div>
  );
}
