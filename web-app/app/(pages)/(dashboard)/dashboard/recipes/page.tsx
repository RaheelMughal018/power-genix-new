'use client';

import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/app/_shared/components/ui/dataTable/dataTable';
import { ConfirmDialog } from '@/app/_shared/components/ui/confirmDialog/confirmDialog';
import { Button } from '@/app/_shared/components/ui/button/button';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { useRecipes } from './useRecipes';

export default function RecipesPage() {
  const router = useRouter();
  const {
    recipes, loading, page, search, totalPages, totalItems,
    setPage, setSearch, isDeleteDialogOpen, setIsDeleteDialogOpen,
    isDeleting, selectedRecipe, setSelectedRecipe, handleDelete,
  } = useRecipes();

  const columns: Column<(typeof recipes)[0]>[] = [
    { key: 'finalProduct', label: 'Final Product', render: (row) => row.finalProduct?.name || '-' },
    { key: 'name', label: 'Recipe Name' },
    { key: 'ingredientsCount', label: 'Ingredients', render: (row) => String(row.ingredientsCount || 0) },
    { key: 'totalCost', label: 'Cost/Unit Price', render: (row) => formatPKR(row.totalCost) },
    {
      key: 'createdBy', label: 'Created By',
      render: (row) => row.createdBy ? `${row.createdBy.firstName} ${row.createdBy.lastName}` : '-',
    },
    {
      key: 'actions', label: 'Actions', width: '180px',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => router.push(`${ROUTES.RECIPES}/${row.id}`)}>View</Button>
          <Button size="sm" variant="outline" onClick={() => router.push(`${ROUTES.RECIPES}/${row.id}/edit`)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => { setSelectedRecipe(row); setIsDeleteDialogOpen(true); }}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-(--color-text-primary)">Recipes</h1>
          <p className="text-(--color-text-secondary)">Manage manufacturing recipes</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={recipes}
        totalItems={totalItems}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={setSearch}
        isLoading={loading}
        actions={
          <Button variant="primary" onClick={() => router.push(ROUTES.RECIPE_CREATE)}>Add Recipe</Button>
        }
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Recipe"
        message={`Are you sure you want to delete "${selectedRecipe?.name}"?`}
        isLoading={isDeleting}
      />
    </div>
  );
}
