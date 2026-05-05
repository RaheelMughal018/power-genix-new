'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/_shared/components/ui/button/button';
import { Spinner } from '@/app/_shared/components/ui/spinner/spinner';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { expensesApi, expenseCategoriesApi, accountsApi } from '@/app/_shared/lib/api/client';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import { DateInput } from '@/app/_shared/components/ui/dateInput/dateInput';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { SearchableDropdown } from '@/app/_shared/components/ui/searchableDropdown/searchableDropdown';

interface DropdownOption { id: number; name: string; }

interface ExpenseRow {
  id: string;
  date: string;
  description: string;
  amount: string;
  categoryId: string;
  accountId: string;
  notes: string;
}

const makeRow = (): ExpenseRow => ({
  id: typeof crypto !== 'undefined' ? crypto.randomUUID() : String(Date.now()),
  date: new Date().toISOString().slice(0, 10),
  description: '',
  amount: '',
  categoryId: '',
  accountId: '',
  notes: '',
});

const unwrapList = <T,>(res: { data: unknown }): T[] => {
  const raw = res.data as { data?: { data: T[] } } & { data: T[] };
  if (raw.data && Array.isArray((raw.data as { data?: T[] }).data)) return (raw.data as { data: T[] }).data;
  if (Array.isArray(raw.data)) return raw.data;
  return [];
};

export default function CreateExpensesPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<DropdownOption[]>([]);
  const [accounts, setAccounts] = useState<DropdownOption[]>([]);
  const [rows, setRows] = useState<ExpenseRow[]>([makeRow()]);

  useEffect(() => {
    const load = async () => {
      try {
        const [catRes, accRes] = await Promise.all([
          expenseCategoriesApi.getAll({ limit: 200 }),
          accountsApi.getAll({ limit: 200 }),
        ]);
        setCategories(unwrapList<DropdownOption>(catRes));
        setAccounts(unwrapList<DropdownOption>(accRes));
      } catch {
        addToast({ title: 'Error', description: 'Failed to load data', variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateRow = (id: string, field: keyof ExpenseRow, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, makeRow()]);

  const removeRow = (id: string) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const liveTotal = rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  const handleSubmit = async () => {
    const valid = rows.filter((r) => r.date && r.description.trim() && r.amount && r.categoryId && r.accountId);

    if (valid.length === 0) {
      addToast({ title: 'Error', description: 'Fill in at least one complete expense row', variant: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await expensesApi.createBatch({
        expenses: valid.map((r) => ({
          date: r.date,
          description: r.description.trim(),
          amount: parseFloat(r.amount),
          categoryId: Number(r.categoryId),
          accountId: Number(r.accountId),
          notes: r.notes.trim() || undefined,
        })),
      });
      addToast({ title: 'Success', description: `${valid.length} expense(s) created`, variant: 'success' });
      router.push(ROUTES.EXPENSES);
    } catch {
      addToast({ title: 'Error', description: 'Failed to create expenses', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-(--color-text-primary)">Add Expenses</h1>
          <p className="text-(--color-text-secondary)">Add one or more expenses in a batch</p>
        </div>
        <Button variant="outline" onClick={() => router.push(ROUTES.EXPENSES)}>Back</Button>
      </div>

      <div className="form-container space-y-4">
        <div className="overflow-x-auto rounded-lg border border-(--color-border)">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-(--color-bg-secondary) border-b border-(--color-border)">
                <th className="px-3 py-2 text-left text-(--color-text-primary) font-medium min-w-[130px]">Date *</th>
                <th className="px-3 py-2 text-left text-(--color-text-primary) font-medium min-w-[200px]">Description *</th>
                <th className="px-3 py-2 text-left text-(--color-text-primary) font-medium min-w-[120px]">Amount *</th>
                <th className="px-3 py-2 text-left text-(--color-text-primary) font-medium min-w-[160px]">Category *</th>
                <th className="px-3 py-2 text-left text-(--color-text-primary) font-medium min-w-[160px]">Account *</th>
                <th className="px-3 py-2 text-left text-(--color-text-primary) font-medium min-w-[180px]">Notes</th>
                <th className="px-3 py-2 w-[50px]" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-(--color-border) last:border-0">
                  <td className="px-2 py-2">
                    <DateInput value={row.date} onChange={(v) => updateRow(row.id, 'date', v)} />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={row.description}
                      onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                      placeholder="Description"
                      className="w-full px-2 py-1.5 rounded border border-(--color-border) bg-(--color-bg-primary) text-(--color-text-primary) text-sm"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.amount}
                      onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2 py-1.5 rounded border border-(--color-border) bg-(--color-bg-primary) text-(--color-text-primary) text-sm"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <SearchableDropdown
                      options={categories.map((c) => ({ value: c.id, label: c.name }))}
                      value={row.categoryId ? Number(row.categoryId) : undefined}
                      onChange={(v) => updateRow(row.id, 'categoryId', String(v))}
                      placeholder="Select category"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <SearchableDropdown
                      options={accounts.map((a) => ({ value: a.id, label: a.name }))}
                      value={row.accountId ? Number(row.accountId) : undefined}
                      onChange={(v) => updateRow(row.id, 'accountId', String(v))}
                      placeholder="Select account"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={row.notes}
                      onChange={(e) => updateRow(row.id, 'notes', e.target.value)}
                      placeholder="Optional notes"
                      className="w-full px-2 py-1.5 rounded border border-(--color-border) bg-(--color-bg-primary) text-(--color-text-primary) text-sm"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      disabled={rows.length === 1}
                      className="text-(--color-text-secondary) hover:text-red-500 disabled:opacity-30 text-lg leading-none"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-(--color-bg-secondary) border-t border-(--color-border)">
                <td colSpan={2} className="px-3 py-2">
                  <button
                    type="button"
                    onClick={addRow}
                    className="text-sm text-(--color-primary-600) hover:underline font-medium"
                  >
                    + Add Row
                  </button>
                </td>
                <td className="px-3 py-2 font-semibold text-(--color-text-primary)">{formatPKR(liveTotal)}</td>
                <td colSpan={4} />
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex gap-3">
          <Button variant="primary" onClick={handleSubmit} isLoading={submitting}>
            Save Expenses
          </Button>
          <Button variant="outline" onClick={() => router.push(ROUTES.EXPENSES)}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
