'use client';

import { useState, useEffect, useCallback } from 'react';
import { recipesApi } from '@/app/_shared/lib/api/client';
import { useToast } from '@/app/_shared/components/ui/toast/toast';

interface RecipeListItem extends Record<string, unknown> {
  id: number;
  name: string;
  finalProduct: { id: number; name: string };
  ingredientsCount: number;
  totalCost: number;
  createdBy: { firstName: string; lastName: string };
}

interface RecipesResponse {
  data: RecipeListItem[];
  meta: { totalItems: number; currentPage: number; totalPages: number; itemsPerPage: number };
}

export function useRecipes() {
  const { addToast } = useToast();
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeListItem | null>(null);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await recipesApi.getAll({ page, limit: 10, search: search || undefined });
      const raw = response.data as { data?: RecipesResponse } & RecipesResponse;
      const resData = raw.data && Array.isArray((raw.data as RecipesResponse).data) ? raw.data as RecipesResponse : raw;
      setRecipes(Array.isArray(resData.data) ? resData.data : []);
      setTotalPages(resData.meta?.totalPages ?? 1);
      setTotalItems(resData.meta?.totalItems ?? 0);
    } catch {
      addToast({ title: 'Error', description: 'Failed to load recipes', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);

  const handleDelete = async () => {
    if (!selectedRecipe) return;
    setIsDeleting(true);
    try {
      await recipesApi.remove(selectedRecipe.id);
      addToast({ title: 'Success', description: 'Recipe deleted', variant: 'success' });
      setIsDeleteDialogOpen(false);
      setSelectedRecipe(null);
      fetchRecipes();
    } catch {
      addToast({ title: 'Error', description: 'Failed to delete recipe', variant: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    recipes, loading, page, search, totalPages, totalItems,
    setPage, setSearch: (v: string) => { setSearch(v); setPage(1); },
    isDeleteDialogOpen, setIsDeleteDialogOpen, isDeleting, selectedRecipe, setSelectedRecipe,
    handleDelete, refetch: fetchRecipes,
  };
}
