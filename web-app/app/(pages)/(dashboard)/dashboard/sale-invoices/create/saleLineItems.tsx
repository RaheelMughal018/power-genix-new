'use client';

import { useEffect, useState } from 'react';
import { saleInvoicesApi } from '@/app/_shared/lib/api/client';
import { Button } from '@/app/_shared/components/ui/button/button';
import { SearchableDropdown } from '@/app/_shared/components/ui/searchableDropdown/searchableDropdown';
import { formatPKR } from '@/app/_shared/lib/utils/currency';

export interface SaleLineItem {
  id: string;
  itemId: string;
  itemName: string;
  itemType: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  serialNumber?: string;
}

export interface ItemOption {
  id: string;
  name: string;
  type: string;
  avgPrice?: number;
}

interface SerialOption {
  serialNumber: string;
  unitCost: number;
}

interface SaleLineItemsProps {
  lineItems: SaleLineItem[];
  onLineItemsChange: (items: SaleLineItem[]) => void;
  itemOptions: ItemOption[];
  discount: number;
  onDiscountChange: (v: number) => void;
}

function SerialDropdown({
  itemId, value, onChange,
}: { itemId: string; value: string; onChange: (serial: string, unitCost: number) => void }) {
  const [serials, setSerials] = useState<SerialOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!itemId) { setSerials([]); return; }
    setLoading(true);
    saleInvoicesApi.getAvailableSerials(Number(itemId))
      .then((res) => {
        const outer = res.data as { data: { serials: Array<{ serialNumber: string; unitCost: number }> } };
        setSerials(outer.data?.serials || []);
      })
      .catch(() => setSerials([]))
      .finally(() => setLoading(false));
  }, [itemId]);

  return (
    <SearchableDropdown
      options={serials.map((s) => ({ value: s.serialNumber, label: s.serialNumber }))}
      value={value || undefined}
      onChange={(v) => {
        const selected = serials.find((s) => s.serialNumber === String(v));
        onChange(String(v), selected?.unitCost || 0);
      }}
      placeholder={loading ? 'Loading...' : 'Select serial'}
      disabled={loading}
    />
  );
}

const emptyRow = (): SaleLineItem => ({
  id: typeof crypto !== 'undefined' ? crypto.randomUUID() : String(Date.now()),
  itemId: '', itemName: '', itemType: '', quantity: 1, unitPrice: 0, totalPrice: 0,
});

export function SaleLineItems({ lineItems, onLineItemsChange, itemOptions, discount, onDiscountChange }: SaleLineItemsProps) {
  const updateRow = (id: string, patch: Partial<SaleLineItem>) => {
    onLineItemsChange(lineItems.map((li) => {
      if (li.id !== id) return li;
      const updated = { ...li, ...patch };
      updated.totalPrice = updated.quantity * updated.unitPrice;
      return updated;
    }));
  };

  const handleItemChange = (id: string, itemId: string) => {
    const opt = itemOptions.find((o) => o.id === itemId);
    updateRow(id, {
      itemId,
      itemName: opt?.name || '',
      itemType: opt?.type || '',
      unitPrice: opt?.avgPrice || 0,
      serialNumber: undefined,
      quantity: opt?.type === 'final_product' ? 1 : 1,
    });
  };

  const handleSerialChange = (id: string, serial: string, unitCost: number) => {
    updateRow(id, { serialNumber: serial, unitPrice: unitCost });
  };

  const removeRow = (id: string) => {
    if (lineItems.length === 1) return;
    onLineItemsChange(lineItems.filter((li) => li.id !== id));
  };

  const subtotal = lineItems.reduce((s, li) => s + li.totalPrice, 0);
  const grandTotal = Math.max(0, subtotal - discount);

  return (
    <div className="space-y-3">
      <div className="border border-(--color-border) rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-(--color-bg-secondary)">
            <tr>
              <th className="text-left px-3 py-2 text-(--color-text-secondary) font-medium w-1/3">Item</th>
              <th className="text-left px-3 py-2 text-(--color-text-secondary) font-medium w-1/4">Serial #</th>
              <th className="text-right px-3 py-2 text-(--color-text-secondary) font-medium w-20">Qty</th>
              <th className="text-right px-3 py-2 text-(--color-text-secondary) font-medium w-36">Unit Price</th>
              <th className="text-right px-3 py-2 text-(--color-text-secondary) font-medium w-36">Total</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {lineItems.map((li) => (
              <tr key={li.id} className="border-t border-(--color-border)">
                <td className="px-3 py-2">
                  <SearchableDropdown
                    options={itemOptions.map((o) => ({ value: o.id, label: o.name }))}
                    value={li.itemId || undefined}
                    onChange={(v) => handleItemChange(li.id, String(v))}
                    placeholder="Select item"
                  />
                </td>
                <td className="px-3 py-2">
                  {li.itemType === 'final_product' && li.itemId ? (
                    <SerialDropdown
                      itemId={li.itemId}
                      value={li.serialNumber || ''}
                      onChange={(serial, unitCost) => handleSerialChange(li.id, serial, unitCost)}
                    />
                  ) : (
                    <span className="text-(--color-text-secondary) text-xs px-2">—</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={1}
                    value={li.quantity}
                    readOnly={li.itemType === 'final_product'}
                    onChange={(e) => updateRow(li.id, { quantity: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 rounded border border-(--color-border) bg-(--color-bg-primary) text-(--color-text-primary) text-sm text-right"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={0}
                    value={li.unitPrice}
                    onChange={(e) => updateRow(li.id, { unitPrice: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 rounded border border-(--color-border) bg-(--color-bg-primary) text-(--color-text-primary) text-sm text-right"
                  />
                </td>
                <td className="px-3 py-2 text-right font-medium text-(--color-text-primary) whitespace-nowrap">{formatPKR(li.totalPrice)}</td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => removeRow(li.id)}
                    className="text-(--color-text-secondary) hover:text-red-500 text-lg leading-none"
                  >×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button size="sm" variant="outline" onClick={() => onLineItemsChange([...lineItems, emptyRow()])}>
        + Add Row
      </Button>

      <div className="flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-(--color-text-secondary)">Subtotal</span>
            <span className="text-(--color-text-primary)">{formatPKR(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-(--color-text-secondary)">Discount</span>
            <input
              type="number"
              min={0}
              value={discount}
              onChange={(e) => onDiscountChange(Number(e.target.value))}
              className="w-28 px-2 py-1 rounded border border-(--color-border) bg-(--color-bg-primary) text-(--color-text-primary) text-sm text-right"
            />
          </div>
          <div className="flex justify-between font-semibold border-t border-(--color-border) pt-1">
            <span className="text-(--color-text-primary)">Grand Total</span>
            <span className="text-(--color-primary-600)">{formatPKR(grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
