'use client';

import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { Button } from '@/app/_shared/components/ui/button/button';
import { SearchableDropdown } from '@/app/_shared/components/ui/searchableDropdown/searchableDropdown';

interface ItemOption {
  id: number;
  name: string;
  averagePrice: number;
  unit: string;
}

interface IngredientRowProps {
  index: number;
  itemId: number;
  quantity: number;
  rawMaterials: ItemOption[];
  onChange: (index: number, field: 'itemId' | 'quantity', value: number) => void;
  onRemove: (index: number) => void;
  readOnly?: boolean;
}

export const IngredientRow = ({
  index, itemId, quantity, rawMaterials, onChange, onRemove, readOnly,
}: IngredientRowProps) => {
  const selectedItem = rawMaterials.find((m) => m.id === itemId);
  const lineTotal = (selectedItem?.averagePrice || 0) * quantity;

  return (
    <div className="grid grid-cols-12 gap-3 items-center">
      <div className="col-span-4">
        <SearchableDropdown
          value={itemId || ''}
          onChange={(v) => onChange(index, 'itemId', Number(v))}
          options={rawMaterials.map((m) => ({ value: m.id, label: m.name }))}
          placeholder="Select item"
          disabled={readOnly}
        />
      </div>
      <div className="col-span-2">
        <input
          type="number"
          min={1}
          value={quantity || ''}
          onChange={(e) => onChange(index, 'quantity', Number(e.target.value))}
          disabled={readOnly}
          placeholder="Qty"
          className="w-full px-3 py-2 rounded-lg border border-(--color-border) bg-(--color-bg-primary) text-(--color-text-primary) text-sm"
        />
      </div>
      <div className="col-span-2 text-sm text-(--color-text-secondary)">
        {selectedItem ? formatPKR(Number(selectedItem.averagePrice)) : '-'}
      </div>
      <div className="col-span-2 text-sm font-medium text-(--color-text-primary)">
        {formatPKR(lineTotal)}
      </div>
      <div className="col-span-2">
        {!readOnly && (
          <Button size="sm" variant="danger" onClick={() => onRemove(index)}>Remove</Button>
        )}
      </div>
    </div>
  );
};
