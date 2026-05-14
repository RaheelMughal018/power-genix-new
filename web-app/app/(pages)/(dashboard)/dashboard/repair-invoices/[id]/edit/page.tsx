'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/app/_shared/components/ui/button/button';
import { Spinner } from '@/app/_shared/components/ui/spinner/spinner';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { repairInvoicesApi, customersApi, itemsApi } from '@/app/_shared/lib/api/client';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import { SearchableDropdown } from '@/app/_shared/components/ui/searchableDropdown/searchableDropdown';
import { DateInput } from '@/app/_shared/components/ui/dateInput/dateInput';
import { RepairLineItems, emptyRow, type RepairLineItem, type ItemOption } from '../../create/repairLineItems';

interface CustomerOption { id: number; name: string; }

interface InvoiceDetail {
  id: number;
  date: string;
  description: string;
  serialNumber?: string;
  isCharged: boolean;
  laborCost?: number;
  customer: { id: number; name: string };
  items: Array<{
    id: number;
    item: { id: number; name: string } | null;
    customItemName: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    isReal: boolean;
  }>;
}

const inputCls = 'w-full px-3 py-2 rounded-lg border border-(--color-border) bg-(--color-bg-primary) text-(--color-text-primary)';
const labelCls = 'text-sm font-medium text-(--color-text-primary)';

export default function EditRepairInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [itemOptions, setItemOptions] = useState<ItemOption[]>([]);

  const [customerId, setCustomerId] = useState<number>(0);
  const [isCharged, setIsCharged] = useState(true);
  const [serialNumber, setSerialNumber] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [laborCost, setLaborCost] = useState(0);
  const [lineItems, setLineItems] = useState<RepairLineItem[]>([emptyRow()]);

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
          repairInvoicesApi.getById(id),
        ]);
        setCustomers(unwrapList<CustomerOption>(custRes));
        const items = unwrapList<{ id: number; name: string; averagePrice?: number }>(itemRes);
        setItemOptions(items.map((i) => ({ id: String(i.id), name: i.name, avgPrice: i.averagePrice })));

        const inv = unwrapOne<InvoiceDetail>(invRes);
        setCustomerId(inv.customer?.id || 0);
        setDate(inv.date?.slice(0, 10) || '');
        setDescription(inv.description || '');
        setSerialNumber(inv.serialNumber || '');
        setIsCharged(inv.isCharged ?? true);
        setLaborCost(inv.laborCost || 0);
        setLineItems((inv.items || []).map((li) => ({
          id: String(li.id),
          itemId: li.item ? String(li.item.id) : '',
          itemName: li.item?.name ?? '',
          quantity: li.quantity,
          unitPrice: Number(li.unitPrice),
          totalPrice: Number(li.unitPrice) * li.quantity,
          isReal: li.isReal ?? true,
        })));
      } catch {
        addToast({ title: 'Error', description: 'Failed to load invoice', variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const refreshPrices = async () => {
    setRefreshingPrices(true);
    try {
      const itemRes = await itemsApi.getAll({ limit: 200 });
      const items = unwrapList<{ id: number; name: string; averagePrice?: number }>(itemRes);
      const fresh: ItemOption[] = items.map((i) => ({ id: String(i.id), name: i.name, avgPrice: i.averagePrice }));
      setItemOptions(fresh);
      setLineItems(lineItems.map((li) => {
        if (!li.itemId) return li;
        const opt = fresh.find((o) => o.id === li.itemId);
        if (!opt) return li;
        const unitPrice = Number(opt.avgPrice) || 0;
        return { ...li, unitPrice, totalPrice: unitPrice * li.quantity };
      }));
      addToast({ title: 'Prices refreshed', description: 'Updated to latest average prices', variant: 'success' });
    } catch {
      addToast({ title: 'Error', description: 'Failed to refresh prices', variant: 'error' });
    } finally {
      setRefreshingPrices(false);
    }
  };

  const handleSubmit = async () => {
    if (!customerId) { addToast({ title: 'Error', description: 'Select a customer', variant: 'error' }); return; }
    if (!description.trim()) { addToast({ title: 'Error', description: 'Description is required', variant: 'error' }); return; }
    if (!date) { addToast({ title: 'Error', description: 'Select a date', variant: 'error' }); return; }
    const validItems = lineItems.filter((l) => l.itemId && l.quantity > 0);
    if (validItems.length === 0) { addToast({ title: 'Error', description: 'Add at least one part', variant: 'error' }); return; }

    setSubmitting(true);
    try {
      await repairInvoicesApi.update(id, {
        customerId, description, date, isCharged,
        serialNumber: serialNumber.trim() || undefined,
        laborCost: isCharged && laborCost > 0 ? laborCost : undefined,
        items: validItems.map((l) => ({ itemId: Number(l.itemId), quantity: l.quantity, unitPrice: l.unitPrice, isReal: l.isReal })),
      });
      addToast({ title: 'Success', description: 'Repair invoice updated', variant: 'success' });
      router.push(`${ROUTES.REPAIR_INVOICES}/${id}`);
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
        <h1 className="text-2xl font-bold text-(--color-text-primary)">Edit Repair Invoice</h1>
        <Button variant="outline" onClick={() => router.push(`${ROUTES.REPAIR_INVOICES}/${id}`)}>Back</Button>
      </div>

      <div className="space-y-1">
        <p className={labelCls}>Type *</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setIsCharged(true)} className={['px-4 py-2 rounded-lg text-sm font-medium border transition-colors', isCharged ? 'bg-(--color-primary-600) text-white border-(--color-primary-600)' : 'border-(--color-border) text-(--color-text-secondary) bg-(--color-bg-primary)'].join(' ')}>Charged</button>
          <button type="button" onClick={() => setIsCharged(false)} className={['px-4 py-2 rounded-lg text-sm font-medium border transition-colors', !isCharged ? 'bg-(--color-primary-600) text-white border-(--color-primary-600)' : 'border-(--color-border) text-(--color-text-secondary) bg-(--color-bg-primary)'].join(' ')}>FOC (Free)</button>
        </div>
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
        <div className="space-y-1">
          <label className={labelCls}>Serial / Product Name</label>
          <input type="text" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className={inputCls} placeholder="e.g. LEH-2026-001 or Samsung 5KW" />
        </div>
      </div>

      <div className="space-y-1">
        <label className={labelCls}>Description *</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder="Describe the repair..." />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-base font-semibold text-(--color-text-primary)">Parts Used</h3>
          <Button size="sm" variant="outline" onClick={refreshPrices} isLoading={refreshingPrices}>Refresh Prices</Button>
        </div>
        <RepairLineItems
          lineItems={lineItems} onLineItemsChange={setLineItems}
          itemOptions={itemOptions} isCharged={isCharged}
          laborCost={laborCost} onLaborCostChange={setLaborCost}
        />
      </div>

      <div className="flex gap-3">
        <Button variant="primary" onClick={handleSubmit} isLoading={submitting}>Save Changes</Button>
        <Button variant="outline" onClick={() => router.push(`${ROUTES.REPAIR_INVOICES}/${id}`)}>Cancel</Button>
      </div>
    </div>
  );
}
