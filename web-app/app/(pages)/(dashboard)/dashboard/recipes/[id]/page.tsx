'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { recipesApi } from '@/app/_shared/lib/api/client';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { Button } from '@/app/_shared/components/ui/button/button';
import { Spinner } from '@/app/_shared/components/ui/spinner/spinner';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { downloadPdf } from '@/app/_shared/lib/utils/download';

interface RecipeDetail {
  id: number;
  name: string;
  finalProduct: { id: number; name: string };
  additionalExpense: number;
  recipeItems: Array<{
    id: number;
    item: { id: number; name: string; averagePrice: number; unit: string };
    quantity: number;
  }>;
  createdBy: { firstName: string; lastName: string };
}

export default function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addToast } = useToast();
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    if (!recipe) return;
    setDownloading(true);
    try {
      await downloadPdf(`/recipes/${recipe.id}/pdf`, `recipe-${recipe.id}.pdf`);
    } catch {
      addToast({ title: 'Error', description: 'Failed to download PDF', variant: 'error' });
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await recipesApi.getById(Number(id));
        const raw = res.data as { data?: RecipeDetail } & RecipeDetail;
        setRecipe((raw.data || raw) as RecipeDetail);
      } catch {
        addToast({ title: 'Error', description: 'Failed to load recipe', variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!recipe) return <p className="text-(--color-text-secondary)">Recipe not found</p>;

  const subtotal = recipe.recipeItems.reduce(
    (sum, ri) => sum + ri.item.averagePrice * ri.quantity, 0
  );
  const totalCost = subtotal + (recipe.additionalExpense || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-(--color-text-secondary) uppercase tracking-wide mb-1">Recipe</p>
          <h1 className="text-3xl font-bold text-(--color-text-primary)">{recipe.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPdf} disabled={downloading}>
            {downloading ? 'Downloading…' : 'Download PDF'}
          </Button>
          <Button variant="outline" onClick={() => router.push(`${ROUTES.RECIPES}/${recipe.id}/edit`)}>Edit</Button>
          <Button variant="outline" onClick={() => router.push(ROUTES.RECIPES)}>← Back</Button>
        </div>
      </div>

      <div className="border-l-4 border-[var(--color-primary-500)] bg-(--color-bg-secondary) rounded-lg border border-(--color-border) p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-[10px] text-(--color-text-secondary) uppercase tracking-widest font-medium mb-1">Final Product</p>
            <p className="text-sm font-semibold text-(--color-text-primary)">{recipe.finalProduct.name}</p>
          </div>
          <div>
            <p className="text-[10px] text-(--color-text-secondary) uppercase tracking-widest font-medium mb-1">Ingredients</p>
            <p className="text-sm font-semibold text-(--color-text-primary)">{recipe.recipeItems.length} items</p>
          </div>
          <div>
            <p className="text-[10px] text-(--color-text-secondary) uppercase tracking-widest font-medium mb-1">Additional Expense</p>
            <p className="text-sm font-semibold text-(--color-text-primary)">{formatPKR(recipe.additionalExpense)}</p>
          </div>
          <div>
            <p className="text-[10px] text-(--color-text-secondary) uppercase tracking-widest font-medium mb-1">Created By</p>
            <p className="text-sm font-semibold text-(--color-text-primary)">{recipe.createdBy.firstName} {recipe.createdBy.lastName}</p>
          </div>
        </div>
      </div>

      <div className="border border-(--color-border) rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-(--color-bg-secondary)">
            <tr>
              <th className="text-left px-4 py-3 text-(--color-text-secondary) font-semibold w-12">#</th>
              <th className="text-left px-4 py-3 text-(--color-text-secondary) font-semibold">Item</th>
              <th className="text-right px-4 py-3 text-(--color-text-secondary) font-semibold">Qty</th>
              <th className="text-center px-4 py-3 text-(--color-text-secondary) font-semibold">Unit</th>
              <th className="text-right px-4 py-3 text-(--color-text-secondary) font-semibold">Avg Price</th>
              <th className="text-right px-4 py-3 text-(--color-text-secondary) font-semibold">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {recipe.recipeItems.map((ri, idx) => (
              <tr key={ri.id} className={[
                'border-t border-(--color-border)',
                idx % 2 === 1 ? 'bg-[var(--color-bg-tertiary)]' : '',
              ].filter(Boolean).join(' ')}>
                <td className="px-4 py-3 text-(--color-text-secondary)">{idx + 1}</td>
                <td className="px-4 py-3 text-(--color-text-primary) font-medium">{ri.item.name}</td>
                <td className="px-4 py-3 text-right text-(--color-text-primary)">{ri.quantity}</td>
                <td className="px-4 py-3 text-center text-(--color-text-secondary) uppercase text-xs">{ri.item.unit}</td>
                <td className="px-4 py-3 text-right text-(--color-text-primary)">{formatPKR(Number(ri.item.averagePrice))}</td>
                <td className="px-4 py-3 text-right font-medium text-(--color-text-primary)">{formatPKR(Number(ri.item.averagePrice) * ri.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <div className="w-72 bg-(--color-bg-secondary) rounded-lg border border-(--color-border) p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-(--color-text-secondary)">Subtotal</span>
            <span className="text-(--color-text-primary)">{formatPKR(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-(--color-text-secondary)">Additional Expense</span>
            <span className="text-(--color-text-primary)">{formatPKR(recipe.additionalExpense)}</span>
          </div>
          <div className="border-t border-(--color-border) pt-3 mt-2 flex justify-between items-baseline">
            <span className="font-semibold text-(--color-text-primary)">Total Cost</span>
            <span className="text-xl font-bold text-(--color-primary-600)">{formatPKR(totalCost)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
