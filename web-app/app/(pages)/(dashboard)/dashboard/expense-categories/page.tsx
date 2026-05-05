'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataTable, type Column } from '@/app/_shared/components/ui/dataTable/dataTable';
import { ConfirmDialog } from '@/app/_shared/components/ui/confirmDialog/confirmDialog';
import { Button } from '@/app/_shared/components/ui/button/button';
import { ExpenseCategoryForm } from '@/app/_shared/components/forms/expenseCategoryForm/expenseCategoryForm';
import { expenseCategoriesApi } from '@/app/_shared/lib/api/client';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { downloadCsv } from '@/app/_shared/lib/utils/download';

interface ExpenseCategory extends Record<string, unknown> {
  id: number;
  name: string;
  description: string | null;
  createdBy: { firstName: string; lastName: string } | null;
}

interface ExpenseCategoriesResponse {
  data: ExpenseCategory[];
  meta: {
    totalItems: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const LIMIT = 10;

export default function ExpenseCategoriesPage() {
  const { addToast } = useToast();

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await expenseCategoriesApi.getAll({ page, limit: LIMIT, search: search || undefined });
      const raw = response.data as { data?: ExpenseCategoriesResponse } & ExpenseCategoriesResponse;
      const resData = raw.data && 'data' in raw.data ? raw.data as ExpenseCategoriesResponse : raw;
      setCategories(Array.isArray(resData.data) ? resData.data : []);
      setTotalPages(resData.meta?.totalPages ?? 1);
      setTotalItems(resData.meta?.totalItems ?? 0);
    } catch {
      addToast({ title: 'Error', description: 'Failed to load expense categories', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, addToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleEditClick = (category: ExpenseCategory) => {
    setSelectedCategory(category);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (category: ExpenseCategory) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCategory) return;
    setIsDeleting(true);
    try {
      await expenseCategoriesApi.remove(selectedCategory.id);
      addToast({ title: 'Expense category deleted', variant: 'success' });
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch {
      addToast({ title: 'Error', description: 'Failed to delete expense category', variant: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      await downloadCsv('/expense-categories/export/csv', 'expense-categories.csv');
    } catch {
      addToast({ title: 'Error', description: 'Failed to export CSV', variant: 'error' });
    }
  };

  const columns: Column<ExpenseCategory>[] = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'name', label: 'Name', sortable: true },
    {
      key: 'description',
      label: 'Description',
      render: (row) => row.description || '—',
    },
    {
      key: 'createdBy',
      label: 'Created By',
      render: (row) =>
        row.createdBy ? `${row.createdBy.firstName} ${row.createdBy.lastName}` : '—',
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '140px',
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEditClick(row)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDeleteClick(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-(--color-text-primary)">Expense Categories</h1>
        <p className="text-(--color-text-secondary)">Manage expense categories</p>
      </div>

      <DataTable<ExpenseCategory>
        columns={columns}
        data={categories}
        isLoading={loading}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search expense categories..."
        onExportCsv={handleExportCsv}
        actions={
          <Button size="sm" variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            Add Category
          </Button>
        }
        emptyTitle="No expense categories yet"
        emptyDescription="Add your first expense category to get started."
        emptyAction={
          <Button size="sm" variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            Add Category
          </Button>
        }
      />

      <ExpenseCategoryForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchCategories}
        category={null}
      />

      <ExpenseCategoryForm
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCategory(null);
        }}
        onSuccess={fetchCategories}
        category={selectedCategory}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedCategory(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Expense Category"
        message={`Are you sure you want to delete "${selectedCategory?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
