'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/_shared/components/ui/button/button';
import { Spinner } from '@/app/_shared/components/ui/spinner/spinner';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { customerPaymentsApi, customersApi, accountsApi } from '@/app/_shared/lib/api/client';
import { SearchableDropdown } from '@/app/_shared/components/ui/searchableDropdown/searchableDropdown';
import { DateInput } from '@/app/_shared/components/ui/dateInput/dateInput';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import { formatPKR } from '@/app/_shared/lib/utils/currency';

interface DropdownOption { id: number; name: string; }
interface AccountOption { id: number; name: string; balance?: number; }

const unwrapList = <T,>(res: { data: unknown }): T[] => {
  const raw = res.data as { data?: { data: T[] } } & { data: T[] };
  if (raw.data && Array.isArray((raw.data as { data?: T[] }).data)) return (raw.data as { data: T[] }).data;
  if (Array.isArray(raw.data)) return raw.data;
  return [];
};

export default function CreateCustomerPaymentPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState<DropdownOption[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);

  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [cusRes, accRes] = await Promise.all([
          customersApi.getAll({ limit: 200 }),
          accountsApi.getAll({ limit: 200 }),
        ]);
        setCustomers(unwrapList<DropdownOption>(cusRes));
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
    if (!customerId) {
      addToast({ title: 'Error', description: 'Select a customer', variant: 'error' });
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
      await customerPaymentsApi.create({
        customerId: Number(customerId),
        amount: parsedAmount,
        accountId: Number(accountId),
        date,
        notes: notes.trim() || undefined,
      });
      addToast({ title: 'Success', description: 'Customer payment created', variant: 'success' });
      router.push(ROUTES.CUSTOMER_PAYMENTS);
    } catch {
      addToast({ title: 'Error', description: 'Failed to create payment', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAccount = accounts.find((a) => String(a.id) === accountId);

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-(--color-text-primary)">Add Customer Payment</h1>
          <p className="text-(--color-text-secondary)">Record a payment received from a customer</p>
        </div>
        <Button variant="outline" onClick={() => router.push(ROUTES.CUSTOMER_PAYMENTS)}>Back</Button>
      </div>

      <div className="form-container space-y-4 max-w-2xl mx-auto">
        <SearchableDropdown
          label="Customer"
          required
          placeholder="Select customer"
          value={customerId}
          onChange={(v) => setCustomerId(String(v))}
          options={customers.map((c) => ({ value: c.id, label: c.name }))}
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
            onChange={(v) => setAccountId(String(v))}
            options={accounts.map((a) => ({ value: a.id, label: a.name, sublabel: a.balance !== undefined ? `Balance: ${formatPKR(a.balance)}` : undefined }))}
          />
          {selectedAccount?.balance !== undefined && (
            <p className="text-xs text-(--color-text-secondary)">
              Available balance: {formatPKR(selectedAccount.balance)}
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
          <Button variant="outline" onClick={() => router.push(ROUTES.CUSTOMER_PAYMENTS)}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
