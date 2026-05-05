'use client';

import React from 'react';
import { type InvoiceLineItem, type ItemOption } from './invoiceForm';
import { SearchableDropdown } from '@/app/_shared/components/ui/searchableDropdown/searchableDropdown';
import styles from './invoiceForm.module.scss';

interface InvoiceFormRowProps {
  item: InvoiceLineItem;
  itemOptions: ItemOption[];
  onChange: (updated: InvoiceLineItem) => void;
  onRemove: () => void;
  showSerialNumber?: boolean;
  showIsReal?: boolean;
  serialOptions?: { itemId: string; serials: string[] }[];
  onItemSelect?: (itemId: string) => void;
  readOnly?: boolean;
}

export const InvoiceFormRow = ({
  item,
  itemOptions,
  onChange,
  onRemove,
  showSerialNumber = false,
  showIsReal = false,
  serialOptions = [],
  onItemSelect,
  readOnly = false,
}: InvoiceFormRowProps) => {
  const selectedOption = itemOptions.find((o) => o.id === item.itemId);
  const availableSerials = serialOptions.find((s) => s.itemId === item.itemId)?.serials ?? [];
  const showSerialDropdown = showSerialNumber && selectedOption?.type === 'final_product';

  const handleItemChange = (val: string | number) => {
    const selectedId = String(val);
    const option = itemOptions.find((o) => o.id === selectedId);
    onChange({
      ...item,
      itemId: selectedId,
      itemName: option?.name ?? '',
      unitPrice: option?.avgPrice ?? item.unitPrice,
    });
    onItemSelect?.(selectedId);
  };

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...item, quantity: Number(e.target.value) });
  };

  const handleUnitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...item, unitPrice: Number(e.target.value) });
  };

  const handleSerialChange = (val: string | number) => {
    onChange({ ...item, serialNumber: String(val) });
  };

  const handleIsRealChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...item, isReal: e.target.checked });
  };

  return (
    <div className={styles.tableRow}>
      <div className={styles.colItem}>
        {readOnly ? (
          <span className={styles.readOnlyValue}>{item.itemName || item.itemId}</span>
        ) : (
          <SearchableDropdown
            options={itemOptions.map((o) => ({ value: o.id, label: o.name }))}
            value={item.itemId || undefined}
            onChange={handleItemChange}
            placeholder="Select item"
          />
        )}
      </div>

      <div className={styles.colQty}>
        {readOnly ? (
          <span className={styles.readOnlyValue}>{item.quantity}</span>
        ) : (
          <input
            className={styles.numberInput}
            type="number"
            min={0}
            value={item.quantity}
            onChange={handleQtyChange}
          />
        )}
      </div>

      <div className={styles.colPrice}>
        {readOnly ? (
          <span className={styles.readOnlyValue}>{item.unitPrice}</span>
        ) : (
          <input
            className={styles.numberInput}
            type="number"
            min={0}
            value={item.unitPrice}
            onChange={handleUnitPriceChange}
          />
        )}
      </div>

      {showSerialNumber && (
        <div className={styles.colSerial}>
          {readOnly || !showSerialDropdown ? (
            <span className={styles.readOnlyValue}>{item.serialNumber ?? '—'}</span>
          ) : (
            <SearchableDropdown
              options={availableSerials.map((s) => ({ value: s, label: s }))}
              value={item.serialNumber || undefined}
              onChange={handleSerialChange}
              placeholder="Select serial"
            />
          )}
        </div>
      )}

      {showIsReal && (
        <div className={[styles.colIsReal, styles.isRealCell].join(' ')}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={item.isReal ?? false}
            onChange={handleIsRealChange}
            disabled={readOnly}
          />
        </div>
      )}

      <div className={styles.colTotal}>
        <span className={styles.totalValue}>{item.totalPrice.toLocaleString()}</span>
      </div>

      {!readOnly && (
        <div className={styles.colActions}>
          <button
            type="button"
            className={styles.removeBtn}
            onClick={onRemove}
            aria-label="Remove row"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
