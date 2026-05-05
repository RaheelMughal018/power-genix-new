'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import { recipeSchema, type RecipeFormValues } from '@/app/_shared/lib/validations/schemas';
import { Input } from '@/app/_shared/components/ui/input/input';
import { Button } from '@/app/_shared/components/ui/button/button';
import { Spinner } from '@/app/_shared/components/ui/spinner/spinner';
import { SearchableDropdown } from '@/app/_shared/components/ui/searchableDropdown/searchableDropdown';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { recipesApi, itemsApi } from '@/app/_shared/lib/api/client';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { IngredientRow } from './ingredientRow';

interface ItemOption {
  id: number;
  name: string;
  averagePrice: number;
  unit: string;
  type: string;
}

interface RecipeFormProps {
  recipeId?: number;
}

export const RecipeForm = ({ recipeId }: RecipeFormProps) => {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(!!recipeId);
  const [finalProducts, setFinalProducts] = useState<ItemOption[]>([]);
  const [rawMaterials, setRawMaterials] = useState<ItemOption[]>([]);

  const isEdit = !!recipeId;

  const formik = useFormik<RecipeFormValues>({
    initialValues: {
      name: '',
      finalProductId: 0,
      additionalExpense: 0,
      items: [{ itemId: 0, quantity: 1 }],
    },
    enableReinitialize: true,
    validationSchema: recipeSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const payload = {
          name: values.name,
          finalProductId: values.finalProductId,
          additionalExpense: values.additionalExpense || 0,
          items: (values.items || []).map((i) => ({ itemId: i.itemId, quantity: i.quantity })),
        };
        if (isEdit) {
          await recipesApi.update(recipeId!, payload);
          addToast({ title: 'Success', description: 'Recipe updated', variant: 'success' });
        } else {
          await recipesApi.create(payload);
          addToast({ title: 'Success', description: 'Recipe created', variant: 'success' });
        }
        router.push(ROUTES.RECIPES);
      } catch {
        addToast({ title: 'Error', description: 'Failed to save recipe', variant: 'error' });
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fpRes, rmRes] = await Promise.all([
          itemsApi.getAll({ limit: 200, type: 'final_product' }),
          itemsApi.getAll({ limit: 200, type: 'raw_material' }),
        ]);
        const unwrap = (res: { data: unknown }) => {
          const raw = res.data as { data?: { data: ItemOption[] }; data2?: ItemOption[] } & { data: ItemOption[] };
          if (raw.data && Array.isArray((raw.data as { data?: ItemOption[] }).data)) return (raw.data as { data: ItemOption[] }).data;
          if (Array.isArray(raw.data)) return raw.data;
          return [];
        };
        setFinalProducts(unwrap(fpRes));
        setRawMaterials(unwrap(rmRes));

        if (recipeId) {
          const recRes = await recipesApi.getById(recipeId);
          const rawRec = recRes.data as { data?: Record<string, unknown> } & Record<string, unknown>;
          const recipe = (rawRec.data || rawRec) as {
            name: string;
            finalProduct: { id: number };
            additionalExpense: number;
            recipeItems: Array<{ item: { id: number }; quantity: number }>;
          };
          formik.setValues({
            name: recipe.name,
            finalProductId: recipe.finalProduct.id,
            additionalExpense: recipe.additionalExpense || 0,
            items: recipe.recipeItems.map((ri) => ({ itemId: ri.item.id, quantity: ri.quantity })),
          });
        }
      } catch {
        addToast({ title: 'Error', description: 'Failed to load data', variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [recipeId]);

  const handleIngredientChange = (index: number, field: 'itemId' | 'quantity', value: number) => {
    const items = [...(formik.values.items || [])];
    items[index] = { ...items[index], [field]: value };
    formik.setFieldValue('items', items);
  };

  const addIngredient = () => {
    formik.setFieldValue('items', [...(formik.values.items || []), { itemId: 0, quantity: 1 }]);
  };

  const removeIngredient = (index: number) => {
    const items = (formik.values.items || []).filter((_, i) => i !== index);
    formik.setFieldValue('items', items.length ? items : [{ itemId: 0, quantity: 1 }]);
  };

  const subtotal = (formik.values.items || []).reduce((sum, item) => {
    const mat = rawMaterials.find((m) => m.id === item.itemId);
    return sum + (mat?.averagePrice || 0) * (item.quantity || 0);
  }, 0);
  const totalCost = subtotal + (formik.values.additionalExpense || 0);

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-(--color-text-primary)">
            {isEdit ? 'Edit Recipe' : 'Create Recipe'}
          </h1>
          <p className="text-(--color-text-secondary)">
            {isEdit ? 'Update the bill of materials' : 'Define a new bill of materials for production'}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push(ROUTES.RECIPES)}>← Back</Button>
      </div>

      <form onSubmit={formik.handleSubmit} className="space-y-6">
        <div className="bg-(--color-bg-primary) border border-(--color-border) rounded-xl p-6 space-y-5">
          <h2 className="text-base font-semibold text-(--color-text-primary)">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="name" name="name" label="Recipe Name" placeholder="Enter recipe name"
              onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.name}
              error={formik.touched.name && formik.errors.name ? formik.errors.name : undefined}
              required
            />
            <SearchableDropdown
              label="Final Product"
              required
              value={formik.values.finalProductId || ''}
              onChange={(v) => formik.setFieldValue('finalProductId', Number(v))}
              options={finalProducts.map((fp) => ({ value: fp.id, label: fp.name }))}
              placeholder="Select final product"
              error={formik.touched.finalProductId && formik.errors.finalProductId ? formik.errors.finalProductId : undefined}
            />
          </div>
        </div>

        <div className="bg-(--color-bg-primary) border border-(--color-border) rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-(--color-text-primary)">Ingredients</h2>
            <Button type="button" size="sm" variant="outline" onClick={addIngredient}>+ Add Ingredient</Button>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-(--color-text-secondary) uppercase tracking-wide px-1 pb-2 border-b border-(--color-border)">
                <div className="col-span-4">Item</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-2">Avg Price</div>
                <div className="col-span-2">Line Total</div>
                <div className="col-span-2"></div>
              </div>
              <div className="space-y-2 pt-2">
                {(formik.values.items || []).map((item, index) => (
                  <IngredientRow
                    key={index}
                    index={index}
                    itemId={item.itemId}
                    quantity={item.quantity}
                    rawMaterials={rawMaterials}
                    onChange={handleIngredientChange}
                    onRemove={removeIngredient}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-(--color-bg-primary) border border-(--color-border) rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-(--color-text-primary)">Cost Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="additionalExpense" name="additionalExpense" type="number" label="Additional Expense (Rs.)"
              placeholder="0" onChange={formik.handleChange} onBlur={formik.handleBlur}
              value={String(formik.values.additionalExpense || '')}
            />
            <div className="flex items-end">
              <div className="p-4 rounded-lg bg-(--color-bg-secondary) border border-(--color-border) w-full">
                <p className="text-xs text-(--color-text-secondary) uppercase tracking-wide font-medium mb-1">Total Recipe Cost</p>
                <p className="text-xl font-bold text-(--color-primary-600)">{formatPKR(totalCost)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" variant="primary" isLoading={formik.isSubmitting}>
            {isEdit ? 'Update Recipe' : 'Create Recipe'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push(ROUTES.RECIPES)}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};
