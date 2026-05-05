'use client';

import React from 'react';
import { InvoiceFormRow } from './invoiceFormRow';
import { InvoiceFormTotals } from './invoiceFormTotals';
import { Button } from '@/app/_shared/components/ui/button/button';
import styles from './invoiceForm.module.scss';

export interface InvoiceLineItem {
  id: string;
  itemId: string;
  itemName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  serialNumber?: string;
  isReal?: boolean;
  [key: string]: unknown;
}

export interface ItemOption {
  id: string;
  name: string;
  type?: string;
  availableQty?: number;
  avgPrice?: number;
}

interface InvoiceFormProps {
  lineItems: InvoiceLineItem[];
  onLineItemsChange: (items: InvoiceLineItem[]) => void;
  itemOptions: ItemOption[];
  discount?: number;
  onDiscountChange?: (discount: number) => void;
  showDiscount?: boolean;
  showSerialNumber?: boolean;
  showIsReal?: boolean;
  serialOptions?: { itemId: string; serials: string[] }[];
  onItemSelect?: (itemId: string, rowIndex: number) => void;
  readOnly?: boolean;
}

const createEmptyRow = (): InvoiceLineItem => ({
  id: typeof crypto !== 'undefined' ? crypto.randomUUID() : String(Date.now()),
  itemId: '',
  itemName: '',
  quantity: 1,
  unitPrice: 0,
  totalPrice: 0,
});

export const InvoiceForm = ({
  lineItems,
  onLineItemsChange,
  itemOptions,
  discount = 0,
  onDiscountChange,
  showDiscount = false,
  showSerialNumber = false,
  showIsReal = false,
  serialOptions = [],
  onItemSelect,
  readOnly = false,
}: InvoiceFormProps) => {
  const handleAddRow = () => {
    onLineItemsChange([...lineItems, createEmptyRow()]);
  };

  const handleRemoveRow = (id: string) => {
    onLineItemsChange(lineItems.filter((item) => item.id !== id));
  };

  const handleRowChange = (updated: InvoiceLineItem, index: number) => {
    const recalculated: InvoiceLineItem = {
      ...updated,
      totalPrice: updated.quantity * updated.unitPrice,
    };
    const next = [...lineItems];
    next[index] = recalculated;
    onLineItemsChange(next);
  };

  const handleItemSelect = (itemId: string, rowIndex: number) => {
    onItemSelect?.(itemId, rowIndex);
  };

  return (
    <div className={styles.invoiceForm}>
      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <span className={styles.colItem}>Item</span>
          <span className={styles.colQty}>Qty</span>
          <span className={styles.colPrice}>Unit Price</span>
          {showSerialNumber && <span className={styles.colSerial}>Serial No.</span>}
          {showIsReal && <span className={styles.colIsReal}>Is Real</span>}
          <span className={styles.colTotal}>Total</span>
          {!readOnly && <span className={styles.colActions} />}
        </div>

        <div className={styles.tableBody}>
          {lineItems.map((item, index) => (
            <InvoiceFormRow
              key={item.id}
              item={item}
              itemOptions={itemOptions}
              onChange={(updated) => handleRowChange(updated, index)}
              onRemove={() => handleRemoveRow(item.id)}
              showSerialNumber={showSerialNumber}
              showIsReal={showIsReal}
              serialOptions={serialOptions}
              onItemSelect={(itemId) => handleItemSelect(itemId, index)}
              readOnly={readOnly}
            />
          ))}

          {lineItems.length === 0 && (
            <div className={styles.emptyState}>No items added yet.</div>
          )}
        </div>
      </div>

      {!readOnly && (
        <div className={styles.addRowWrapper}>
          <Button variant="outline" size="sm" type="button" onClick={handleAddRow}>
            + Add Item
          </Button>
        </div>
      )}

      <InvoiceFormTotals
        lineItems={lineItems}
        discount={discount}
        onDiscountChange={onDiscountChange}
        showDiscount={showDiscount}
      />
    </div>
  );
};
