'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/app/_shared/components/ui/button/button';
import { Spinner } from '@/app/_shared/components/ui/spinner/spinner';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { expensesApi, expenseCategoriesApi, accountsApi } from '@/app/_shared/lib/api/client';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import { SearchableDropdown } from '@/app/_shared/components/ui/searchableDropdown/searchableDropdown';
import { DateInput } from '@/app/_shared/components/ui/dateInput/dateInput';

interface DropdownOption { id: number; name: string; }

interface ExpenseDetail {
  id: number;
  date: string;
  description: string;
  amount: number;
  categoryId: number;
  accountId: number;
  notes: string | null;
  category: { id: number; name: string } | null;
  account: { id: number; name: string } | null;
}

const unwrapList = <T,>(res: { data: unknown }): T[] => {
  const raw = res.data as { data?: { data: T[] } } & { data: T[] };
  if (raw.data && Array.isArray((raw.data as { data?: T[] }).data)) return (raw.data as { data: T[] }).data;
  if (Array.isArray(raw.data)) return raw.data;
  return [];
};

const unwrapOne = <T,>(res: { data: unknown }): T => {
  const raw = res.data as { data?: T } & T;
  return ((raw.data as T) || raw) as T;
};

export default function EditExpensePage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<DropdownOption[]>([]);
  const [accounts, setAccounts] = useState<DropdownOption[]>([]);

  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [catRes, accRes, expRes] = await Promise.all([
          expenseCategoriesApi.getAll({ limit: 200 }),
          accountsApi.getAll({ limit: 200 }),
          expensesApi.getById(id),
        ]);

        setCategories(unwrapList<DropdownOption>(catRes));
        setAccounts(unwrapList<DropdownOption>(accRes));

        const expense = unwrapOne<ExpenseDetail>(expRes);
        setDate(expense.date?.slice(0, 10) || '');
        setDescription(expense.description || '');
        setAmount(String(expense.amount || ''));
        setCategoryId(String(expense.categoryId || expense.category?.id || ''));
        setAccountId(String(expense.accountId || expense.account?.id || ''));
        setNotes(expense.notes || '');
      } catch {
        addToast({ title: 'Error', description: 'Failed to load expense', variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSubmit = async () => {
    if (!date || !description.trim() || !amount || !categoryId || !accountId) {
      addToast({ title: 'Error', description: 'Please fill in all required fields', variant: 'error' });
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      addToast({ title: 'Error', description: 'Amount must be a positive number', variant: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await expensesApi.update(id, {
        date,
        description: description.trim(),
        amount: parsedAmount,
        categoryId: Number(categoryId),
        accountId: Number(accountId),
        notes: notes.trim() || undefined,
      });
      addToast({ title: 'Success', description: 'Expense updated', variant: 'success' });
      router.push(ROUTES.EXPENSES);
    } catch {
      addToast({ title: 'Error', description: 'Failed to update expense', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-(--color-text-primary)">Edit Expense</h1>
        <Button variant="outline" onClick={() => router.push(ROUTES.EXPENSES)}>Back</Button>
      </div>

      <div className="bg-(--color-bg-primary) rounded-xl border border-(--color-border) p-6 space-y-4 max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <DateInput value={date} onChange={setDate} label="Date" required />

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
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-(--color-text-primary)">Description *</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description"
            className="w-full px-3 py-2 rounded-lg border border-(--color-border) bg-(--color-bg-primary) text-(--color-text-primary)"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SearchableDropdown
            label="Category"
            required
            value={categoryId}
            onChange={(v) => setCategoryId(String(v))}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Select category"
          />

          <SearchableDropdown
            label="Account"
            required
            value={accountId}
            onChange={(v) => setAccountId(String(v))}
            options={accounts.map((a) => ({ value: a.id, label: a.name }))}
            placeholder="Select account"
          />
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
      </div>

      <div className="flex gap-3">
        <Button variant="primary" onClick={handleSubmit} isLoading={submitting}>Save Changes</Button>
        <Button variant="outline" onClick={() => router.push(ROUTES.EXPENSES)}>Cancel</Button>
      </div>
    </div>
  );
}
