'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/_shared/components/ui/button/button';
import { Spinner } from '@/app/_shared/components/ui/spinner/spinner';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { supplierPaymentsApi, suppliersApi, accountsApi } from '@/app/_shared/lib/api/client';
import { toLocalISO } from '@/app/_shared/lib/utils/date';
import { SearchableDropdown } from '@/app/_shared/components/ui/searchableDropdown/searchableDropdown';
import { DateInput } from '@/app/_shared/components/ui/dateInput/dateInput';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import { formatPKR } from '@/app/_shared/lib/utils/currency';

interface DropdownOption { id: number; name: string; }
interface AccountOption { id: number; name: string; currentBalance?: number; }

const unwrapList = <T,>(res: { data: unknown }): T[] => {
  const raw = res.data as { data?: { data: T[] } } & { data: T[] };
  if (raw.data && Array.isArray((raw.data as { data?: T[] }).data)) return (raw.data as { data: T[] }).data;
  if (Array.isArray(raw.data)) return raw.data;
  return [];
};

export default function CreateSupplierPaymentPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<DropdownOption[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);

  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState<number | ''>('');
  const [date, setDate] = useState(toLocalISO(new Date()));
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [supRes, accRes] = await Promise.all([
          suppliersApi.getAll({ limit: 200 }),
          accountsApi.getAll({ limit: 200 }),
        ]);
        setSuppliers(unwrapList<DropdownOption>(supRes));
        setAccounts(unwrapList<AccountOption>(accRes));
      } catch {
        addToast({ title: 'Error', description: 'Failed to load data', variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async () => {
    if (!supplierId) {
      addToast({ title: 'Error', description: 'Select a supplier', variant: 'error' });
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      addToast({ title: 'Error', description: 'Enter a valid amount', variant: 'error' });
      return;
    }
    if (!accountId) {
      addToast({ title: 'Error', description: 'Select an account', variant: 'error' });
      return;
    }
    if (!date) {
      addToast({ title: 'Error', description: 'Select a date', variant: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await supplierPaymentsApi.create({
        supplierId: Number(supplierId),
        amount: parsedAmount,
        accountId: Number(accountId),
        date,
        notes: notes.trim() || undefined,
      });
      addToast({ title: 'Success', description: 'Supplier payment created', variant: 'success' });
      router.push(ROUTES.SUPPLIER_PAYMENTS);
    } catch {
      addToast({ title: 'Error', description: 'Failed to create payment', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAccount = accounts.find((a) => a.id === accountId);

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-(--color-text-primary)">Add Supplier Payment</h1>
          <p className="text-(--color-text-secondary)">Record a payment made to a supplier</p>
        </div>
        <Button variant="outline" onClick={() => router.push(ROUTES.SUPPLIER_PAYMENTS)}>Back</Button>
      </div>

      <div className="form-container space-y-4 max-w-2xl mx-auto">
        <SearchableDropdown
          label="Supplier"
          required
          placeholder="Select supplier"
          value={supplierId}
          onChange={(v) => setSupplierId(Number(v))}
          options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-(--color-text-primary)">Amount *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-lg border border-(--color-border) bg-(--color-bg-primary) text-(--color-text-primary)"
            />
          </div>

          <DateInput value={date} onChange={setDate} label="Date" required />
        </div>

        <div className="space-y-1">
          <SearchableDropdown
            label="Account"
            required
            placeholder="Select account"
            value={accountId}
            onChange={(v) => setAccountId(Number(v))}
            options={accounts.map((a) => ({ value: a.id, label: a.name, sublabel: a.currentBalance !== undefined ? `Balance: ${formatPKR(a.currentBalance)}` : undefined }))}
          />
          {selectedAccount?.currentBalance !== undefined && (
            <p className="text-xs text-(--color-text-secondary)">
              Available balance: {formatPKR(selectedAccount.currentBalance)}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-(--color-text-primary)">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Optional notes..."
            className="w-full px-3 py-2 rounded-lg border border-(--color-border) bg-(--color-bg-primary) text-(--color-text-primary) resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="primary" onClick={handleSubmit} isLoading={submitting}>Create Payment</Button>
          <Button variant="outline" onClick={() => router.push(ROUTES.SUPPLIER_PAYMENTS)}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
