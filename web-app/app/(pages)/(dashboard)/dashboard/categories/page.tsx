'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataTable, type Column } from '@/app/_shared/components/ui/dataTable/dataTable';
import { ConfirmDialog } from '@/app/_shared/components/ui/confirmDialog/confirmDialog';
import { Button } from '@/app/_shared/components/ui/button/button';
import { CategoryForm } from '@/app/_shared/components/forms/categoryForm/categoryForm';
import { categoriesApi } from '@/app/_shared/lib/api/client';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { downloadCsv } from '@/app/_shared/lib/utils/download';

interface CategoryCreatedBy {
  firstName: string;
  lastName: string;
}

interface Category extends Record<string, unknown> {
  id: number;
  name: string;
  createdBy: CategoryCreatedBy;
}

interface CategoriesResponse {
  data: Category[];
  meta: {
    totalItems: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const LIMIT = 10;

export default function CategoriesPage() {
  const { addToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await categoriesApi.getAll({ page, limit: LIMIT, search: search || undefined });
      const raw = response.data as { data?: CategoriesResponse } & CategoriesResponse;
      const resData = raw.data && 'data' in raw.data ? raw.data as CategoriesResponse : raw;
      setCategories(Array.isArray(resData.data) ? resData.data : []);
      setTotalPages(resData.meta?.totalPages ?? 1);
      setTotalItems(resData.meta?.totalItems ?? 0);
    } catch {
      addToast({ title: 'Error', description: 'Failed to load categories', variant: 'error' });
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

  const handleEditClick = (category: Category) => {
    setSelectedCategory(category);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCategory) return;
    setIsDeleting(true);
    try {
      await categoriesApi.remove(selectedCategory.id);
      addToast({ title: 'Category deleted', variant: 'success' });
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch {
      addToast({ title: 'Error', description: 'Failed to delete category', variant: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      await downloadCsv('/categories/export/csv', 'categories.csv');
    } catch {
      addToast({ title: 'Error', description: 'Failed to export CSV', variant: 'error' });
    }
  };

  const columns: Column<Category>[] = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'name', label: 'Name', sortable: true },
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
        <h1 className="text-2xl font-bold text-(--color-text-primary)">Categories</h1>
        <p className="text-(--color-text-secondary)">Manage product and expense categories</p>
      </div>

      <DataTable<Category>
        columns={columns}
        data={categories}
        isLoading={loading}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search categories..."
        onExportCsv={handleExportCsv}
        actions={
          <Button size="sm" variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            Add Category
          </Button>
        }
        emptyTitle="No categories yet"
        emptyDescription="Add your first category to get started."
        emptyAction={
          <Button size="sm" variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            Add Category
          </Button>
        }
      />

      <CategoryForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchCategories}
        category={null}
      />

      <CategoryForm
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
        title="Delete Category"
        message={`Are you sure you want to delete "${selectedCategory?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
