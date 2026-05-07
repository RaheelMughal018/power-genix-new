'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/_shared/components/ui/button/button';
import { Spinner } from '@/app/_shared/components/ui/spinner/spinner';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { repairInvoicesApi, customersApi, itemsApi } from '@/app/_shared/lib/api/client';
import { toLocalISO } from '@/app/_shared/lib/utils/date';
import { SearchableDropdown } from '@/app/_shared/components/ui/searchableDropdown/searchableDropdown';
import { DateInput } from '@/app/_shared/components/ui/dateInput/dateInput';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import { RepairLineItems, emptyRow, type RepairLineItem, type ItemOption } from './repairLineItems';

interface CustomerOption { id: number; name: string; }

const inputCls = 'w-full px-3 py-2 rounded-lg border border-(--color-border) bg-(--color-bg-primary) text-(--color-text-primary)';
const labelCls = 'text-sm font-medium text-(--color-text-primary)';

export default function CreateRepairInvoicePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [itemOptions, setItemOptions] = useState<ItemOption[]>([]);

  const [customerId, setCustomerId] = useState<number>(0);
  const [isCharged, setIsCharged] = useState(true);
  const [serialNumber, setSerialNumber] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(toLocalISO(new Date()));
  const [laborCost, setLaborCost] = useState(0);
  const [lineItems, setLineItems] = useState<RepairLineItem[]>([emptyRow()]);

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
    if (!customerId) { addToast({ title: 'Error', description: 'Select a customer', variant: 'error' }); return; }
    if (!description.trim()) { addToast({ title: 'Error', description: 'Description is required', variant: 'error' }); return; }
    if (!date) { addToast({ title: 'Error', description: 'Select a date', variant: 'error' }); return; }
    const validItems = lineItems.filter((l) => l.itemId && l.quantity > 0);
    if (validItems.length === 0) { addToast({ title: 'Error', description: 'Add at least one part', variant: 'error' }); return; }

    setSubmitting(true);
    try {
      await repairInvoicesApi.create({
        customerId, description, date, isCharged,
        serialNumber: serialNumber.trim() || undefined,
        laborCost: isCharged && laborCost > 0 ? laborCost : undefined,
        items: validItems.map((l) => ({ itemId: Number(l.itemId), quantity: l.quantity, unitPrice: l.unitPrice, isReal: l.isReal })),
      });
      addToast({ title: 'Success', description: 'Repair invoice created', variant: 'success' });
      router.push(ROUTES.REPAIR_INVOICES);
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
        <h1 className="text-2xl font-bold text-(--color-text-primary)">New Repair Invoice</h1>
        <Button variant="outline" onClick={() => router.push(ROUTES.REPAIR_INVOICES)}>Back</Button>
      </div>

      <div className="form-container space-y-6">
        <div className="space-y-1">
          <p className={labelCls}>Type *</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsCharged(true)}
              className={[
                'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                isCharged
                  ? 'bg-(--color-primary-600) text-white border-(--color-primary-600)'
                  : 'border-(--color-border) text-(--color-text-secondary) bg-(--color-bg-primary)',
              ].join(' ')}
            >Charged</button>
            <button
              type="button"
              onClick={() => setIsCharged(false)}
              className={[
                'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                !isCharged
                  ? 'bg-(--color-primary-600) text-white border-(--color-primary-600)'
                  : 'border-(--color-border) text-(--color-text-secondary) bg-(--color-bg-primary)',
              ].join(' ')}
            >FOC (Free)</button>
          </div>
        </div>

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

          <div className="space-y-1">
            <label className={labelCls}>Serial / Product Name</label>
            <input
              type="text" value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              className={inputCls} placeholder="e.g. LEH-2026-001 or Samsung 5KW"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className={labelCls}>Description *</label>
          <textarea
            value={description} onChange={(e) => setDescription(e.target.value)}
            rows={3} className={`${inputCls} resize-none`} placeholder="Describe the repair..."
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-semibold text-(--color-text-primary)">Parts Used</h3>
          <RepairLineItems
            lineItems={lineItems} onLineItemsChange={setLineItems}
            itemOptions={itemOptions} isCharged={isCharged}
            laborCost={laborCost} onLaborCostChange={setLaborCost}
          />
        </div>

        <div className="flex gap-3">
          <Button variant="primary" onClick={handleSubmit} isLoading={submitting}>Create Invoice</Button>
          <Button variant="outline" onClick={() => router.push(ROUTES.REPAIR_INVOICES)}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
