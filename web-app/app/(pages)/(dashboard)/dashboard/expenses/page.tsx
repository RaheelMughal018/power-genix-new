'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/app/_shared/components/ui/dataTable/dataTable';
import { ConfirmDialog } from '@/app/_shared/components/ui/confirmDialog/confirmDialog';
import { Button } from '@/app/_shared/components/ui/button/button';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { expensesApi, expenseCategoriesApi, accountsApi } from '@/app/_shared/lib/api/client';
import { DateRangeSelector } from '@/app/_shared/components/ui/dateSelector/dateRangeSelector';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import { SearchableDropdown } from '@/app/_shared/components/ui/searchableDropdown/searchableDropdown';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { formatDate } from '@/app/_shared/lib/utils/date';
import { downloadCsv } from '@/app/_shared/lib/utils/download';

interface Expense extends Record<string, unknown> {
  id: number;
  date: string;
  description: string;
  amount: number;
  category: { id: number; name: string } | null;
  account: { id: number; name: string } | null;
  notes: string | null;
}

interface ExpensesResponse {
  data: Expense[];
  meta: { totalItems: number; currentPage: number; totalPages: number; itemsPerPage: number };
}

interface FilterOption { id: number; name: string; }

const LIMIT = 10;

const unwrapList = <T,>(res: { data: unknown }): T[] => {
  const raw = res.data as { data?: { data: T[] } } & { data: T[] };
  if (raw.data && Array.isArray((raw.data as { data?: T[] }).data)) return (raw.data as { data: T[] }).data;
  if (Array.isArray(raw.data)) return raw.data;
  return [];
};

export default function ExpensesPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [accountId, setAccountId] = useState<number | undefined>();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [categories, setCategories] = useState<FilterOption[]>([]);
  const [accounts, setAccounts] = useState<FilterOption[]>([]);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [catRes, accRes] = await Promise.all([
          expenseCategoriesApi.getAll({ limit: 200 }),
          accountsApi.getAll({ limit: 200 }),
        ]);
        setCategories(unwrapList<FilterOption>(catRes));
        setAccounts(unwrapList<FilterOption>(accRes));
      } catch {
        // non-critical
      }
    };
    loadFilters();
  }, []);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const [expRes, totalRes] = await Promise.all([
        expensesApi.getAll({
          page, limit: LIMIT,
          search: search || undefined,
          categoryId,
          accountId,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        }),
        expensesApi.getTotal(),
      ]);

      const raw = expRes.data as { data?: ExpensesResponse } & ExpensesResponse;
      const resData = raw.data && 'data' in raw.data ? raw.data as ExpensesResponse : raw;
      setExpenses(Array.isArray(resData.data) ? resData.data : []);
      setTotalPages(resData.meta?.totalPages ?? 1);
      setTotalItems(resData.meta?.totalItems ?? 0);

      const totalRaw = totalRes.data as { data?: { total: number } } & { total: number };
      const totalData = totalRaw.data && 'total' in totalRaw.data ? totalRaw.data : totalRaw;
      setTotalAmount(Number(totalData.total ?? 0));
    } catch {
      addToast({ title: 'Error', description: 'Failed to load expenses', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryId, accountId, fromDate, toDate, addToast]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDeleteClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedExpense) return;
    setIsDeleting(true);
    try {
      await expensesApi.remove(selectedExpense.id);
      addToast({ title: 'Expense deleted', variant: 'success' });
      setIsDeleteDialogOpen(false);
      setSelectedExpense(null);
      fetchExpenses();
    } catch {
      addToast({ title: 'Error', description: 'Failed to delete expense', variant: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      await downloadCsv('/expenses/export/csv', 'expenses.csv');
    } catch {
      addToast({ title: 'Error', description: 'Failed to export CSV', variant: 'error' });
    }
  };

  const columns: Column<Expense>[] = [
    { key: 'date', label: 'Date', render: (row) => formatDate(row.date) },
    { key: 'description', label: 'Description' },
    { key: 'category', label: 'Category', render: (row) => row.category?.name || '—' },
    { key: 'account', label: 'Account', render: (row) => row.account?.name || '—' },
    { key: 'amount', label: 'Amount', render: (row) => formatPKR(row.amount) },
    {
      key: 'actions',
      label: 'Actions',
      width: '140px',
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => router.push(`${ROUTES.EXPENSES}/${row.id}/edit`)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDeleteClick(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const footerRow = (
    <tr>
      <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-(--color-text-primary)">Total</td>
      <td className="px-4 py-3 text-sm font-bold text-(--color-primary-600)">{formatPKR(totalAmount)}</td>
      <td />
    </tr>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-(--color-text-primary)">Expenses</h1>
        <p className="text-(--color-text-secondary)">Track and manage business expenses</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchableDropdown
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          value={categoryId || ''}
          onChange={(v) => { setCategoryId(v ? Number(v) : undefined); setPage(1); }}
          placeholder="All Categories"
        />

        <SearchableDropdown
          options={accounts.map((a) => ({ value: a.id, label: a.name }))}
          value={accountId || ''}
          onChange={(v) => { setAccountId(v ? Number(v) : undefined); setPage(1); }}
          placeholder="All Accounts"
        />

      </div>

      <DateRangeSelector
        from={fromDate}
        to={toDate}
        onChange={(range) => {
          setFromDate(range?.from ?? '');
          setToDate(range?.to ?? '');
          setPage(1);
        }}
      />

      <DataTable<Expense>
        columns={columns}
        data={expenses}
        isLoading={loading}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search expenses..."
        onExportCsv={handleExportCsv}
        footerRow={footerRow}
        actions={
          <Button size="sm" variant="primary" onClick={() => router.push(ROUTES.EXPENSE_CREATE)}>
            Add Expenses
          </Button>
        }
        emptyTitle="No expenses yet"
        emptyDescription="Add your first expense to get started."
        emptyAction={
          <Button size="sm" variant="primary" onClick={() => router.push(ROUTES.EXPENSE_CREATE)}>
            Add Expenses
          </Button>
        }
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedExpense(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Expense"
        message={`Are you sure you want to delete "${selectedExpense?.description}"? The amount will be refunded to the account.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
