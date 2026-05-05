'use client';

import React from 'react';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { type InvoiceLineItem } from './invoiceForm';
import styles from './invoiceForm.module.scss';

interface InvoiceFormTotalsProps {
  lineItems: InvoiceLineItem[];
  discount?: number;
  onDiscountChange?: (discount: number) => void;
  showDiscount?: boolean;
}

export const InvoiceFormTotals = ({
  lineItems,
  discount = 0,
  onDiscountChange,
  showDiscount = false,
}: InvoiceFormTotalsProps) => {
  const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const grandTotal = subtotal - discount;

  return (
    <div className={styles.totals}>
      <div className={styles.totalsRow}>
        <span className={styles.totalsLabel}>Subtotal</span>
        <span className={styles.totalsValue}>{formatPKR(subtotal)}</span>
      </div>

      {showDiscount && (
        <div className={styles.totalsRow}>
          <span className={styles.totalsLabel}>Discount</span>
          <input
            type="number"
            min={0}
            value={discount}
            onChange={(e) => onDiscountChange?.(Number(e.target.value))}
            className={[styles.numberInput, styles.discountInput].join(' ')}
          />
        </div>
      )}

      <div className={[styles.totalsRow, styles.grandTotalRow].join(' ')}>
        <span className={styles.totalsLabel}>Grand Total</span>
        <span className={[styles.totalsValue, styles.grandTotalValue].join(' ')}>
          {formatPKR(grandTotal)}
        </span>
      </div>
    </div>
  );
};
