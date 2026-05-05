'use client';

import React from 'react';
import { Button } from '@/app/_shared/components/ui/button/button';
import { SearchableDropdown } from '@/app/_shared/components/ui/searchableDropdown/searchableDropdown';
import { DateInput } from '@/app/_shared/components/ui/dateInput/dateInput';
import type { AdjustmentFormValues, ItemOption, SupplierOption, ItemInfo } from './useStockAdjustments';

const ADD_REASONS = [
  { label: 'Opening Stock', value: 'opening_stock' },
  { label: 'Miscount', value: 'miscount' },
];

const DEDUCT_REASONS = [
  { label: 'Return to Supplier', value: 'return_to_supplier' },
  { label: 'Damaged / Lost', value: 'damaged_lost' },
];

interface AdjustmentFormProps {
  form: AdjustmentFormValues;
  items: ItemOption[];
  suppliers: SupplierOption[];
  selectedItemInfo: ItemInfo | null;
  itemInfoLoading: boolean;
  submitting: boolean;
  editingId: number | null;
  onItemChange: (id: number | '') => void;
  onTypeChange: (type: 'add' | 'deduct') => void;
  onFieldChange: <K extends keyof AdjustmentFormValues>(key: K, value: AdjustmentFormValues[K]) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export const AdjustmentForm = ({
  form,
  items,
  suppliers,
  selectedItemInfo,
  itemInfoLoading,
  submitting,
  editingId,
  onItemChange,
  onTypeChange,
  onFieldChange,
  onSubmit,
  onCancel,
}: AdjustmentFormProps) => {
  const reasons = form.type === 'add' ? ADD_REASONS : DEDUCT_REASONS;
  const showUnitPrice = form.type === 'add';
  const showSupplier = form.reason === 'return_to_supplier';

  const formRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (editingId && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [editingId]);

  return (
    <div
      ref={formRef}
      className={[
        'rounded-xl p-6 space-y-5 border transition-all',
        editingId
          ? 'bg-(--color-primary-50) border-(--color-primary-300) ring-2 ring-(--color-primary-200)'
          : 'bg-(--color-surface) border-(--color-border)',
      ].filter(Boolean).join(' ')}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-(--color-text-primary)">
          {editingId ? `Editing Adjustment #${editingId}` : 'New Stock Adjustment'}
        </h2>
        {editingId && (
          <Button size="sm" variant="outline" onClick={onCancel}>
            Cancel Edit
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Item */}
        <div className="flex flex-col gap-1">
          <SearchableDropdown
            label="Item"
            required
            options={items.map((item) => ({ value: item.id, label: item.name }))}
            value={form.itemId || undefined}
            onChange={(v) => onItemChange(v ? Number(v) : '')}
            placeholder="Select item..."
          />
        </div>

        {/* Date */}
        <DateInput value={form.date} onChange={(v) => onFieldChange('date', v)} label="Date" required />
      </div>

      {/* Item Info Card */}
      {itemInfoLoading && (
        <p className="text-sm text-(--color-text-secondary)">Loading item info…</p>
      )}
      {selectedItemInfo && !itemInfoLoading && (
        <div className="bg-(--color-background) border border-(--color-border) rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-(--color-text-secondary)">Item</p>
            <p className="font-semibold text-(--color-text-primary)">{selectedItemInfo.name}</p>
          </div>
          <div>
            <p className="text-(--color-text-secondary)">Current Qty</p>
            <p className="font-semibold text-(--color-text-primary)">{selectedItemInfo.totalQuantity} {selectedItemInfo.unit}</p>
          </div>
          <div>
            <p className="text-(--color-text-secondary)">Avg Price</p>
            <p className="font-semibold text-(--color-text-primary)">Rs. {selectedItemInfo.avgPrice?.toFixed(2) ?? '0.00'}</p>
          </div>
          <div>
            <p className="text-(--color-text-secondary)">Total Value</p>
            <p className="font-semibold text-(--color-text-primary)">Rs. {selectedItemInfo.totalAmount?.toFixed(2) ?? '0.00'}</p>
          </div>
        </div>
      )}

      {/* Type Toggle */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-(--color-text-secondary)">Adjustment Type *</label>
        <div className="flex gap-2">
          {(['add', 'deduct'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTypeChange(t)}
              className={[
                'px-5 py-2 rounded-lg text-sm font-medium border transition-colors',
                form.type === t
                  ? t === 'add'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-red-600 text-white border-red-600'
                  : 'bg-(--color-background) text-(--color-text-secondary) border-(--color-border) hover:border-(--color-text-secondary)',
              ].filter(Boolean).join(' ')}
            >
              {t === 'add' ? '+ Add' : '− Deduct'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Reason */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-(--color-text-secondary)">Reason *</label>
          <select
            className="border border-(--color-border) rounded-lg px-3 py-2 bg-(--color-background) text-(--color-text-primary) text-sm"
            value={form.reason}
            onChange={(e) => onFieldChange('reason', e.target.value)}
          >
            <option value="">Select reason...</option>
            {reasons.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* Quantity */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-(--color-text-secondary)">Quantity *</label>
          <input
            type="number"
            min="0"
            step="any"
            className="border border-(--color-border) rounded-lg px-3 py-2 bg-(--color-background) text-(--color-text-primary) text-sm"
            placeholder="0"
            value={form.quantity}
            onChange={(e) => onFieldChange('quantity', e.target.value)}
          />
        </div>

        {/* Unit Price (add only) */}
        {showUnitPrice && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-(--color-text-secondary)">Unit Price (Rs.)</label>
            <input
              type="number"
              min="0"
              step="any"
              className="border border-(--color-border) rounded-lg px-3 py-2 bg-(--color-background) text-(--color-text-primary) text-sm"
              placeholder="0.00"
              value={form.unitPrice}
              onChange={(e) => onFieldChange('unitPrice', e.target.value)}
            />
          </div>
        )}

        {/* Supplier (return_to_supplier only) */}
        {showSupplier && (
          <div className="flex flex-col gap-1">
            <SearchableDropdown
              label="Supplier"
              options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
              value={form.supplierId || undefined}
              onChange={(v) => onFieldChange('supplierId', v ? Number(v) : '')}
              placeholder="Select supplier..."
            />
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-(--color-text-secondary)">Notes</label>
        <textarea
          rows={2}
          className="border border-(--color-border) rounded-lg px-3 py-2 bg-(--color-background) text-(--color-text-primary) text-sm resize-none"
          placeholder="Optional notes..."
          value={form.notes}
          onChange={(e) => onFieldChange('notes', e.target.value)}
        />
      </div>

      <div className="flex gap-3">
        <Button variant="primary" onClick={onSubmit} disabled={submitting}>
          {submitting ? 'Saving...' : editingId ? 'Update Adjustment' : 'Save Adjustment'}
        </Button>
        {editingId && (
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};
