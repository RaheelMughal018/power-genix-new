'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/app/_shared/components/ui/button/button';
import { Spinner } from '@/app/_shared/components/ui/spinner/spinner';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { InvoiceForm, type InvoiceLineItem, type ItemOption } from '@/app/_shared/components/forms/invoiceForm/invoiceForm';
import { purchaseInvoicesApi, suppliersApi, itemsApi } from '@/app/_shared/lib/api/client';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import { SearchableDropdown } from '@/app/_shared/components/ui/searchableDropdown/searchableDropdown';
import { DateInput } from '@/app/_shared/components/ui/dateInput/dateInput';

interface SupplierOption { id: number; name: string; }

interface InvoiceDetail {
  id: number;
  invoiceNumber: string;
  date: string;
  discount: number;
  notes?: string;
  supplier: { id: number; name: string };
  items: Array<{ id: number; item: { id: number; name: string }; quantity: number; unitPrice: number; totalPrice: number }>;
}

export default function EditPurchaseInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [itemOptions, setItemOptions] = useState<ItemOption[]>([]);

  const [supplierId, setSupplierId] = useState<number>(0);
  const [date, setDate] = useState('');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
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
        const [supRes, itemRes, invRes] = await Promise.all([
          suppliersApi.getAll({ limit: 200 }),
          itemsApi.getAll({ limit: 200 }),
          purchaseInvoicesApi.getById(id),
        ]);
        setSuppliers(unwrapList<SupplierOption>(supRes));
        const items = unwrapList<{ id: number; name: string; averagePrice?: number }>(itemRes);
        setItemOptions(items.map((i) => ({ id: String(i.id), name: i.name, avgPrice: i.averagePrice })));

        const inv = unwrapOne<InvoiceDetail>(invRes);
        setSupplierId(inv.supplier?.id || 0);
        setDate(inv.date?.slice(0, 10) || '');
        setDiscount(inv.discount || 0);
        setNotes(inv.notes || '');
        setLineItems((inv.items || []).map((li) => ({
          id: String(li.id),
          itemId: String(li.item.id),
          itemName: li.item.name,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          totalPrice: li.totalPrice,
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
      await purchaseInvoicesApi.update(id, {
        supplierId, date, discount: discount || undefined, notes: notes || undefined,
        items: validItems.map((l) => ({ itemId: Number(l.itemId), quantity: l.quantity, unitPrice: l.unitPrice })),
      });
      addToast({ title: 'Success', description: 'Purchase invoice updated', variant: 'success' });
      router.push(`${ROUTES.PURCHASE_INVOICES}/${id}`);
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
        <h1 className="text-2xl font-bold text-(--color-text-primary)">Edit Purchase Invoice</h1>
        <Button variant="outline" onClick={() => router.push(`${ROUTES.PURCHASE_INVOICES}/${id}`)}>Back</Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SearchableDropdown
          label="Supplier"
          required
          value={supplierId || ''}
          onChange={(v) => setSupplierId(Number(v))}
          options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
          placeholder="Select supplier"
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
        <Button variant="primary" onClick={handleSubmit} isLoading={submitting}>Save Changes</Button>
        <Button variant="outline" onClick={() => router.push(`${ROUTES.PURCHASE_INVOICES}/${id}`)}>Cancel</Button>
      </div>
    </div>
  );
}
