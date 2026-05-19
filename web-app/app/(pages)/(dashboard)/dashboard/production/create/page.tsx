'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/app/_shared/components/ui/input/input';
import { Button } from '@/app/_shared/components/ui/button/button';
import { Spinner } from '@/app/_shared/components/ui/spinner/spinner';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { recipesApi, itemsApi, accountsApi, productionApi } from '@/app/_shared/lib/api/client';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { toLocalISO } from '@/app/_shared/lib/utils/date';
import { SearchableDropdown } from '@/app/_shared/components/ui/searchableDropdown/searchableDropdown';
import { DateInput } from '@/app/_shared/components/ui/dateInput/dateInput';

interface RecipeOption { id: number; name: string; finalProduct: { id: number; name: string }; additionalExpense?: number; }
interface RawMaterial { id: number; name: string; averagePrice: number; unit: string; }
interface AccountOption { id: number; name: string; type: string; currentBalance: number; }
interface UnitItem { itemId: number; quantity: number; unitPrice: number; }
interface Unit { serialNumber: string; items: UnitItem[]; }

export default function CreateProductionPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recipes, setRecipes] = useState<RecipeOption[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);

  const [recipeId, setRecipeId] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [productionDate, setProductionDate] = useState(toLocalISO(new Date()));
  const [copperAmount, setCopperAmount] = useState<number>(0);
  const [copperAccountId, setCopperAccountId] = useState<number>(0);
  const [recipeExpense, setRecipeExpense] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [editMode, setEditMode] = useState<'batch' | 'individual'>('batch');
  const [refreshingPrices, setRefreshingPrices] = useState(false);

  const unwrap = <T,>(res: { data: unknown }): T[] => {
    const raw = res.data as { data?: { data: T[] } } & { data: T[] };
    if (raw.data && Array.isArray((raw.data as { data?: T[] }).data)) return (raw.data as { data: T[] }).data;
    if (Array.isArray(raw.data)) return raw.data;
    return [];
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recRes, rmRes, accRes] = await Promise.all([
          recipesApi.getAll({ limit: 200 }),
          itemsApi.getAll({ limit: 200, type: 'raw_material' }),
          accountsApi.getAll({ limit: 200 }),
        ]);
        setRecipes(unwrap<RecipeOption>(recRes));
        setRawMaterials(unwrap<RawMaterial>(rmRes));
        setAccounts(unwrap<AccountOption>(accRes));
      } catch {
        addToast({ title: 'Error', description: 'Failed to load data', variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const [serialPrefix, setSerialPrefix] = useState('');
  const [serialSuffixes, setSerialSuffixes] = useState<string[]>([]);

  const initializeUnits = async (recId: number, qty: number) => {
    if (!recId || qty < 1) return;
    try {
      const recRes = await recipesApi.getById(recId);
      const rawRec = recRes.data as { data?: Record<string, unknown> } & Record<string, unknown>;
      const recipe = (rawRec.data || rawRec) as { recipeItems: Array<{ item: { id: number }; quantity: number }>; additionalExpense?: number };
      setRecipeExpense(Number(recipe.additionalExpense) || 0);

      // Get prefix from generate-serials to know the format
      const serialRes = await productionApi.generateSerials(qty);
      const rawSer = serialRes.data as { data?: { serials: string[] } } & { serials?: string[] };
      const serials = (rawSer.data as { serials?: string[] })?.serials || rawSer.serials || [];

      if (serials[0]) {
        const parts = serials[0].split('-');
        setSerialPrefix(parts[0]);
        setSerialSuffixes(serials.map((s) => s.split('-').slice(1).join('-')));
      }

      const baseItems: UnitItem[] = recipe.recipeItems.map((ri) => {
        const mat = rawMaterials.find((m) => m.id === ri.item.id);
        return { itemId: ri.item.id, quantity: ri.quantity, unitPrice: mat?.averagePrice || 0 };
      });

      const newUnits: Unit[] = Array.from({ length: qty }, (_, i) => ({
        serialNumber: serials[i] || '',
        items: baseItems.map((item) => ({ ...item })),
      }));
      setUnits(newUnits);
    } catch {
      addToast({ title: 'Error', description: 'Failed to initialize units', variant: 'error' });
    }
  };

  const updateSerialSuffix = (index: number, suffix: string) => {
    const newSuffixes = [...serialSuffixes];
    newSuffixes[index] = suffix;
    setSerialSuffixes(newSuffixes);
    const updated = [...units];
    updated[index] = { ...updated[index], serialNumber: `${serialPrefix}-${suffix}` };
    setUnits(updated);
  };

  const handleRecipeChange = (id: number) => {
    setRecipeId(id);
    if (id && quantity > 0) initializeUnits(id, quantity);
  };

  const handleQuantityChange = (qty: number) => {
    setQuantity(qty);
    if (recipeId && qty > 0) initializeUnits(recipeId, qty);
  };

  const updateUnitItem = (unitIdx: number, itemIdx: number, field: 'itemId' | 'quantity' | 'unitPrice', value: number) => {
    const updated = [...units];
    updated[unitIdx] = { ...updated[unitIdx], items: [...updated[unitIdx].items] };
    updated[unitIdx].items[itemIdx] = { ...updated[unitIdx].items[itemIdx], [field]: value };
    if (field === 'itemId') {
      const mat = rawMaterials.find((m) => m.id === value);
      updated[unitIdx].items[itemIdx].unitPrice = mat?.averagePrice || 0;
    }
    setUnits(updated);
  };

  const updateBatchItem = (itemIdx: number, field: 'itemId' | 'quantity' | 'unitPrice', value: number) => {
    const updated = units.map((unit) => ({
      ...unit,
      items: unit.items.map((item, i) => {
        if (i !== itemIdx) return item;
        const newItem = { ...item, [field]: value };
        if (field === 'itemId') {
          const mat = rawMaterials.find((m) => m.id === value);
          newItem.unitPrice = mat?.averagePrice || 0;
        }
        return newItem;
      }),
    }));
    setUnits(updated);
  };

  const addBatchItem = () => {
    const newItem: UnitItem = { itemId: 0, quantity: 1, unitPrice: 0 };
    setUnits(units.map((unit) => ({ ...unit, items: [...unit.items, { ...newItem }] })));
  };

  const removeBatchItem = (itemIdx: number) => {
    if (units[0]?.items.length <= 1) return;
    setUnits(units.map((unit) => ({ ...unit, items: unit.items.filter((_, i) => i !== itemIdx) })));
  };

  const addUnitItem = (unitIdx: number) => {
    const updated = [...units];
    updated[unitIdx] = { ...updated[unitIdx], items: [...updated[unitIdx].items, { itemId: 0, quantity: 1, unitPrice: 0 }] };
    setUnits(updated);
  };

  const removeUnitItem = (unitIdx: number, itemIdx: number) => {
    if (units[unitIdx]?.items.length <= 1) return;
    const updated = [...units];
    updated[unitIdx] = { ...updated[unitIdx], items: updated[unitIdx].items.filter((_, i) => i !== itemIdx) };
    setUnits(updated);
  };

  const refreshPrices = async () => {
    if (units.length === 0) return;
    setRefreshingPrices(true);
    try {
      const rmRes = await itemsApi.getAll({ limit: 200, type: 'raw_material' });
      const fresh = unwrap<RawMaterial>(rmRes);
      setRawMaterials(fresh);
      setUnits(units.map((unit) => ({
        ...unit,
        items: unit.items.map((item) => {
          const mat = fresh.find((m) => m.id === item.itemId);
          return mat ? { ...item, unitPrice: Number(mat.averagePrice) || 0 } : item;
        }),
      })));
      addToast({ title: 'Prices refreshed', description: 'Updated to latest average prices', variant: 'success' });
    } catch {
      addToast({ title: 'Error', description: 'Failed to refresh prices', variant: 'error' });
    } finally {
      setRefreshingPrices(false);
    }
  };

  const copperPerUnit = quantity > 0 ? copperAmount / quantity : 0;
  const unitCosts = units.map((u) =>
    u.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0) + copperPerUnit + recipeExpense
  );
  const totalCost = unitCosts.reduce((sum, c) => sum + c, 0);

  const handleSubmit = async () => {
    if (!recipeId || units.length === 0) {
      addToast({ title: 'Error', description: 'Select a recipe and set quantity', variant: 'error' });
      return;
    }
    if (!productionDate) {
      addToast({ title: 'Error', description: 'Select a production date', variant: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      await productionApi.create({
        recipeId, quantity, productionDate, copperAmount, copperAccountId: copperAccountId || undefined,
        notes: notes || undefined, units,
      });
      addToast({ title: 'Success', description: 'Production batch created', variant: 'success' });
      router.push(ROUTES.PRODUCTION);
    } catch {
      addToast({ title: 'Error', description: 'Failed to create batch', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-(--color-text-primary)">New Production Batch</h1>
        <Button variant="outline" onClick={() => router.push(ROUTES.PRODUCTION)}>Back</Button>
      </div>

      <div className="form-container space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <SearchableDropdown
            label="Recipe"
            required
            placeholder="Select recipe"
            value={recipeId || ''}
            onChange={(v) => handleRecipeChange(Number(v))}
            options={recipes.map((r) => ({ value: r.id, label: `${r.name} (${r.finalProduct?.name})` }))}
          />
          <Input id="quantity" type="number" label="Quantity *" min={1} value={String(quantity)}
            onChange={(e) => handleQuantityChange(Number(e.target.value))} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <DateInput value={productionDate} onChange={setProductionDate} label="Production Date" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input id="copperAmount" type="number" label="Copper Amount" min={0} value={String(copperAmount || '')}
            onChange={(e) => setCopperAmount(Number(e.target.value))} />
          <SearchableDropdown
            label="Copper Account"
            placeholder="Select account"
            value={copperAccountId || ''}
            onChange={(v) => setCopperAccountId(Number(v))}
            options={accounts.map((a) => ({ value: a.id, label: a.name, sublabel: `Balance: ${formatPKR(a.currentBalance)}` }))}
          />
        </div>

        <Input id="notes" label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />

        {units.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold text-(--color-text-primary)">Units ({units.length})</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant={editMode === 'batch' ? 'primary' : 'outline'} onClick={() => setEditMode('batch')}>Edit Batch</Button>
                  <Button size="sm" variant={editMode === 'individual' ? 'primary' : 'outline'} onClick={() => setEditMode('individual')}>Edit Individual</Button>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={refreshPrices} isLoading={refreshingPrices}>Refresh Prices</Button>
            </div>

            <div className="border border-(--color-border) rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-(--color-text-primary)">Serial Numbers</p>
              <p className="text-xs text-(--color-text-secondary)">Format: {serialPrefix}-YYYY-NNN (enter year and sequence after {serialPrefix}-)</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {serialSuffixes.map((suffix, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="text-sm text-(--color-text-secondary) whitespace-nowrap">{serialPrefix}-</span>
                    <input
                      type="text"
                      value={suffix}
                      onChange={(e) => updateSerialSuffix(i, e.target.value)}
                      placeholder="2026-001"
                      maxLength={20}
                      className="w-32 px-2 py-1.5 rounded-lg border border-(--color-border) bg-(--color-bg-primary) text-(--color-text-primary) text-sm text-center"
                    />
                  </div>
                ))}
              </div>
            </div>

            {editMode === 'batch' && units[0] && (
              <div className="border border-(--color-border) rounded-lg p-4 space-y-2">
                <p className="text-sm text-(--color-text-secondary)">Changes apply to ALL units</p>
                {units[0].items.map((item, itemIdx) => (
                  <div key={itemIdx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <SearchableDropdown
                        options={rawMaterials.map((m) => ({ value: m.id, label: m.name }))}
                        value={item.itemId || undefined}
                        onChange={(v) => updateBatchItem(itemIdx, 'itemId', Number(v))}
                        placeholder="Select"
                      />
                    </div>
                    <div className="col-span-2">
                      <input type="number" min={1} value={item.quantity || ''} onChange={(e) => updateBatchItem(itemIdx, 'quantity', Number(e.target.value))}
                        className="w-full px-2 py-1 rounded border border-(--color-border) bg-(--color-bg-primary) text-(--color-text-primary) text-sm" />
                    </div>
                    <div className="col-span-2 text-sm">{formatPKR(item.unitPrice)}</div>
                    <div className="col-span-2 text-sm font-medium">{formatPKR(item.quantity * item.unitPrice)}</div>
                    <div className="col-span-1 text-sm">per unit</div>
                    <div className="col-span-1">
                      <button type="button" onClick={() => removeBatchItem(itemIdx)} className="text-(--color-text-secondary) hover:text-red-500 text-lg">×</button>
                    </div>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={addBatchItem}>+ Add Item</Button>
              </div>
            )}

            {editMode === 'individual' && units.map((unit, unitIdx) => (
              <div key={unitIdx} className="border border-(--color-border) rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-(--color-text-primary)">
                  {unit.serialNumber || `Unit ${unitIdx + 1}`} — Cost: {formatPKR(unitCosts[unitIdx])}
                </p>
                {unit.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <SearchableDropdown
                        options={rawMaterials.map((m) => ({ value: m.id, label: m.name }))}
                        value={item.itemId || undefined}
                        onChange={(v) => updateUnitItem(unitIdx, itemIdx, 'itemId', Number(v))}
                        placeholder="Select"
                      />
                    </div>
                    <div className="col-span-2">
                      <input type="number" min={1} value={item.quantity || ''} onChange={(e) => updateUnitItem(unitIdx, itemIdx, 'quantity', Number(e.target.value))}
                        className="w-full px-2 py-1 rounded border border-(--color-border) bg-(--color-bg-primary) text-(--color-text-primary) text-sm" />
                    </div>
                    <div className="col-span-2 text-sm">{formatPKR(item.unitPrice)}</div>
                    <div className="col-span-3 text-sm font-medium">{formatPKR(item.quantity * item.unitPrice)}</div>
                    <div className="col-span-1">
                      <button type="button" onClick={() => removeUnitItem(unitIdx, itemIdx)} className="text-(--color-text-secondary) hover:text-red-500 text-lg">×</button>
                    </div>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={() => addUnitItem(unitIdx)}>+ Add Item</Button>
              </div>
            ))}
          </div>
        )}

        <div className="p-4 bg-(--color-bg-secondary) rounded-lg border border-(--color-border) space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-(--color-text-secondary)">Materials per unit</span>
            <span className="text-(--color-text-primary)">{formatPKR(units[0]?.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0) || 0)}</span>
          </div>
          {recipeExpense > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-(--color-text-secondary)">Recipe expense (per unit)</span>
              <span className="text-(--color-text-primary)">{formatPKR(recipeExpense)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-(--color-text-secondary)">Copper per unit</span>
            <span className="text-(--color-text-primary)">{formatPKR(copperPerUnit)}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-(--color-border) pt-2">
            <span className="text-(--color-text-secondary)">Cost per unit</span>
            <span className="font-semibold text-(--color-text-primary)">{formatPKR(unitCosts[0] || 0)}</span>
          </div>
          <div className="flex justify-between items-baseline border-t border-(--color-border) pt-2">
            <span className="font-semibold text-(--color-text-primary)">Total Batch Cost</span>
            <span className="text-2xl font-bold text-(--color-primary-600)">{formatPKR(totalCost)}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="primary" onClick={handleSubmit} isLoading={submitting}>Create Batch</Button>
          <Button variant="outline" onClick={() => router.push(ROUTES.PRODUCTION)}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
