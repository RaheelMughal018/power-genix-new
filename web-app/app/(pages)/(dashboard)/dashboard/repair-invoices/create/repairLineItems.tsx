'use client';

import { Button } from '@/app/_shared/components/ui/button/button';
import { SearchableDropdown } from '@/app/_shared/components/ui/searchableDropdown/searchableDropdown';
import { formatPKR } from '@/app/_shared/lib/utils/currency';

export interface RepairLineItem {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isReal: boolean;
}

export interface ItemOption {
  id: string;
  name: string;
  avgPrice?: number;
}

interface RepairLineItemsProps {
  lineItems: RepairLineItem[];
  onLineItemsChange: (items: RepairLineItem[]) => void;
  itemOptions: ItemOption[];
  isCharged: boolean;
  laborCost: number;
  onLaborCostChange: (v: number) => void;
  discount: number;
  onDiscountChange: (v: number) => void;
}

const emptyRow = (): RepairLineItem => ({
  id: typeof crypto !== 'undefined' ? crypto.randomUUID() : String(Date.now()),
  itemId: '', itemName: '',
  quantity: 1, unitPrice: 0, totalPrice: 0, isReal: true,
});

export { emptyRow };

export function RepairLineItems({
  lineItems, onLineItemsChange, itemOptions, isCharged, laborCost, onLaborCostChange, discount, onDiscountChange,
}: RepairLineItemsProps) {
  const updateRow = (id: string, patch: Partial<RepairLineItem>) => {
    onLineItemsChange(lineItems.map((li) => {
      if (li.id !== id) return li;
      const updated = { ...li, ...patch };
      updated.quantity = Number(updated.quantity) || 0;
      updated.unitPrice = Number(updated.unitPrice) || 0;
      updated.totalPrice = updated.quantity * updated.unitPrice;
      return updated;
    }));
  };

  const handleItemChange = (id: string, itemId: string) => {
    const opt = itemOptions.find((o) => o.id === itemId);
    updateRow(id, { itemId, itemName: opt?.name || '', unitPrice: opt?.avgPrice || 0 });
  };

  const removeRow = (id: string) => {
    if (lineItems.length === 1) return;
    onLineItemsChange(lineItems.filter((li) => li.id !== id));
  };

  const partsTotal = lineItems.reduce((s, li) => s + (Number(li.totalPrice) || 0), 0);
  const discountValue = isCharged ? (Number(discount) || 0) : 0;
  const grandTotal = Math.max(0, partsTotal + (isCharged ? (Number(laborCost) || 0) : 0) - discountValue);

  const cellCls = 'w-full px-2 py-1.5 rounded border border-(--color-border) bg-(--color-bg-primary) text-(--color-text-primary) text-sm';

  return (
    <div className="space-y-3">
      <div className="border border-(--color-border) rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-(--color-bg-secondary)">
            <tr>
              <th className="text-left px-3 py-2 text-(--color-text-secondary) font-medium">Item</th>
              <th className="text-right px-3 py-2 text-(--color-text-secondary) font-medium w-20">Qty</th>
              <th className="text-right px-3 py-2 text-(--color-text-secondary) font-medium w-28">Unit Price</th>
              <th className="text-right px-3 py-2 text-(--color-text-secondary) font-medium w-28">Total</th>
              <th className="text-center px-3 py-2 text-(--color-text-secondary) font-medium w-32">Deduct Stock</th>
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
                  <input
                    type="number" min={1} value={li.quantity}
                    onChange={(e) => updateRow(li.id, { quantity: Number(e.target.value) })}
                    className={`${cellCls} text-right`}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number" min={0} value={li.unitPrice}
                    onChange={(e) => updateRow(li.id, { unitPrice: Number(e.target.value) })}
                    className={`${cellCls} text-right`}
                  />
                </td>
                <td className="px-3 py-2 text-right font-medium text-(--color-text-primary)">{formatPKR(li.totalPrice)}</td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox" checked={li.isReal}
                    onChange={(e) => updateRow(li.id, { isReal: e.target.checked })}
                    className="w-4 h-4 accent-(--color-primary-600)"
                  />
                </td>
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
            <span className="text-(--color-text-secondary)">Parts Total</span>
            <span className="text-(--color-text-primary)">{formatPKR(partsTotal)}</span>
          </div>
          {isCharged && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-(--color-text-secondary)">Labor Cost</span>
              <input
                type="number" min={0} value={laborCost}
                onChange={(e) => onLaborCostChange(Number(e.target.value))}
                className="w-28 px-2 py-1 rounded border border-(--color-border) bg-(--color-bg-primary) text-(--color-text-primary) text-sm text-right"
              />
            </div>
          )}
          {isCharged && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-(--color-text-secondary)">Discount</span>
              <input
                type="number" min={0} value={discount}
                onChange={(e) => onDiscountChange(Number(e.target.value))}
                className="w-28 px-2 py-1 rounded border border-(--color-border) bg-(--color-bg-primary) text-(--color-text-primary) text-sm text-right"
              />
            </div>
          )}
          <div className="flex justify-between font-semibold border-t border-(--color-border) pt-1">
            <span className="text-(--color-text-primary)">Grand Total</span>
            <span className="text-(--color-primary-600)">{formatPKR(grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
