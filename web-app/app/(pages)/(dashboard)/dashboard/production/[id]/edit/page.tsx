'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/app/_shared/components/ui/input/input';
import { Button } from '@/app/_shared/components/ui/button/button';
import { Spinner } from '@/app/_shared/components/ui/spinner/spinner';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { productionApi, itemsApi, accountsApi } from '@/app/_shared/lib/api/client';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { SearchableDropdown } from '@/app/_shared/components/ui/searchableDropdown/searchableDropdown';

interface RawMaterial { id: number; name: string; averagePrice: number; unit: string; }
interface AccountOption { id: number; name: string; type: string; currentBalance: number; }
interface UnitItem { itemId: number; quantity: number; unitPrice: number; }
interface Unit { id?: number; serialNumber: string; items: UnitItem[]; }

interface BatchDetail {
  id: number; batchNumber: string; quantity: number; status: string;
  copperAmount: number; copperAccountId: number | null; notes: string | null;
  recipe: { id: number; name: string; additionalExpense?: number; finalProduct: { id: number; name: string } };
  units?: Array<{ id: number; serialNumber: string; unitCost: number; items?: Array<{ itemId: number; quantity: number; unitPrice: number }> }>;
  productionUnits?: Array<{ id: number; serialNumber: string; unitCost: number; productionUnitItems?: Array<{ itemId: number; item?: { id: number }; quantity: number; unitPrice: number }> }>;
}

export default function EditProductionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [batch, setBatch] = useState<BatchDetail | null>(null);

  const [copperAmount, setCopperAmount] = useState<number>(0);
  const [copperAccountId, setCopperAccountId] = useState<number>(0);
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
        const [rmRes, accRes, batchRes] = await Promise.all([
          itemsApi.getAll({ limit: 200, type: 'raw_material' }),
          accountsApi.getAll({ limit: 200 }),
          productionApi.getById(Number(id)),
        ]);
        setRawMaterials(unwrap<RawMaterial>(rmRes));
        setAccounts(unwrap<AccountOption>(accRes));

        const rawBatch = batchRes.data as { data?: BatchDetail } & BatchDetail;
        const b = (rawBatch.data || rawBatch) as BatchDetail;
        setBatch(b);

        setCopperAmount(Number(b.copperAmount) || 0);
        setCopperAccountId(b.copperAccountId || 0);
        setNotes(b.notes || '');

        const allUnits = b.productionUnits || b.units || [];
        setUnits(allUnits.map((u) => {
          const unitItems = (u as { productionUnitItems?: Array<{ itemId: number; item?: { id: number }; quantity: number; unitPrice: number }> }).productionUnitItems
            || (u as { items?: Array<{ itemId: number; quantity: number; unitPrice: number }> }).items || [];
          return {
            id: u.id,
            serialNumber: u.serialNumber,
            items: unitItems.map((i) => ({
              itemId: (i as { item?: { id: number } }).item?.id || i.itemId,
              quantity: i.quantity,
              unitPrice: Number(i.unitPrice),
            })),
          };
        }));
      } catch {
        addToast({ title: 'Error', description: 'Failed to load batch', variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

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

  const quantity = batch?.quantity || 0;
  const recipeExpense = Number(batch?.recipe?.additionalExpense) || 0;
  const copperPerUnit = quantity > 0 ? copperAmount / quantity : 0;
  const unitCosts = units.map((u) =>
    u.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0) + copperPerUnit + recipeExpense
  );
  const totalCost = unitCosts.reduce((sum, c) => sum + c, 0);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await productionApi.update(Number(id), {
        copperAmount, copperAccountId: copperAccountId || undefined,
        notes: notes || undefined,
        units: units.map((u) => ({ serialNumber: u.serialNumber, items: u.items })),
      });
      addToast({ title: 'Success', description: 'Production batch updated', variant: 'success' });
      router.push(`${ROUTES.PRODUCTION}/${id}`);
    } catch {
      addToast({ title: 'Error', description: 'Failed to update batch', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!batch) return <p className="text-center py-12 text-(--color-text-secondary)">Batch not found</p>;
  if (batch.status !== 'pending') {
    return (
      <div className="space-y-4">
        <p className="text-(--color-text-secondary)">Only pending batches can be edited.</p>
        <Button variant="outline" onClick={() => router.push(`${ROUTES.PRODUCTION}/${id}`)}>← Back to Detail</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-(--color-text-secondary) uppercase tracking-wide mb-1">Edit Production</p>
          <h1 className="text-2xl font-bold text-(--color-text-primary)">{batch.batchNumber}</h1>
          <p className="text-sm text-(--color-text-secondary)">{batch.recipe?.name} — {batch.recipe?.finalProduct?.name} × {batch.quantity}</p>
        </div>
        <Button variant="outline" onClick={() => router.push(`${ROUTES.PRODUCTION}/${id}`)}>← Back</Button>
      </div>

      <div className="bg-(--color-bg-primary) border border-(--color-border) rounded-xl p-6 space-y-5">
        <h2 className="text-base font-semibold text-(--color-text-primary)">Cost & Account</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      {units.length > 0 && (
        <div className="bg-(--color-bg-primary) border border-(--color-border) rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-base font-semibold text-(--color-text-primary)">Units ({units.length})</h2>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant={editMode === 'batch' ? 'primary' : 'outline'} onClick={() => setEditMode('batch')}>Edit All</Button>
              <Button size="sm" variant={editMode === 'individual' ? 'primary' : 'outline'} onClick={() => setEditMode('individual')}>Edit Individual</Button>
              <Button size="sm" variant="outline" onClick={refreshPrices} isLoading={refreshingPrices}>Refresh Prices</Button>
            </div>
          </div>

          {editMode === 'batch' && units[0] && (
            <div className="space-y-2">
              <p className="text-xs text-(--color-text-secondary)">Changes apply to ALL units</p>
              <div className="overflow-x-auto">
                <div className="min-w-[500px] space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-(--color-text-secondary) uppercase px-1">
                    <div className="col-span-4">Item</div>
                    <div className="col-span-2">Qty</div>
                    <div className="col-span-2">Unit Price</div>
                    <div className="col-span-3">Total</div>
                    <div className="col-span-1" />
                  </div>
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
                          className="w-full px-2 py-2 rounded-lg border border-(--color-border) bg-(--color-bg-primary) text-(--color-text-primary) text-sm" />
                      </div>
                      <div className="col-span-2 text-sm text-(--color-text-secondary) px-1">{formatPKR(item.unitPrice)}</div>
                      <div className="col-span-3 text-sm font-medium text-(--color-text-primary) px-1">{formatPKR(item.quantity * item.unitPrice)}</div>
                      <div className="col-span-1">
                        <button type="button" onClick={() => removeBatchItem(itemIdx)} className="text-(--color-text-secondary) hover:text-red-500 text-lg">×</button>
                      </div>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={addBatchItem}>+ Add Item</Button>
                </div>
              </div>
            </div>
          )}

          {editMode === 'individual' && units.map((unit, unitIdx) => (
            <div key={unitIdx} className="border border-(--color-border) rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-(--color-text-primary)">{unit.serialNumber}</span>
                <span className="text-sm font-bold text-(--color-primary-600)">{formatPKR(unitCosts[unitIdx])}</span>
              </div>
              <div className="overflow-x-auto">
                <div className="min-w-[500px] space-y-2">
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
                          className="w-full px-2 py-2 rounded-lg border border-(--color-border) bg-(--color-bg-primary) text-(--color-text-primary) text-sm" />
                      </div>
                      <div className="col-span-2 text-sm text-(--color-text-secondary) px-1">{formatPKR(item.unitPrice)}</div>
                      <div className="col-span-3 text-sm font-medium text-(--color-text-primary) px-1">{formatPKR(item.quantity * item.unitPrice)}</div>
                      <div className="col-span-1">
                        <button type="button" onClick={() => removeUnitItem(unitIdx, itemIdx)} className="text-(--color-text-secondary) hover:text-red-500 text-lg">×</button>
                      </div>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => addUnitItem(unitIdx)}>+ Add Item</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 bg-(--color-bg-secondary) rounded-lg border border-(--color-border) space-y-2">
        {(() => {
          const totalMaterials = units.reduce((s, u) => s + u.items.reduce((si, i) => si + i.quantity * i.unitPrice, 0), 0);
          const avgMaterials = quantity > 0 ? totalMaterials / quantity : 0;
          const avgCost = quantity > 0 ? totalCost / quantity : 0;
          return (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-(--color-text-secondary)">Avg materials per unit</span>
                <span className="text-(--color-text-primary)">{formatPKR(avgMaterials)}</span>
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
                <span className="text-(--color-text-secondary)">Avg cost per unit</span>
                <span className="font-semibold text-(--color-text-primary)">{formatPKR(avgCost)}</span>
              </div>
              <div className="flex justify-between items-baseline border-t border-(--color-border) pt-2">
                <span className="font-semibold text-(--color-text-primary)">Total Batch Cost</span>
                <span className="text-2xl font-bold text-(--color-primary-600)">{formatPKR(totalCost)}</span>
              </div>
            </>
          );
        })()}
      </div>

      <div className="flex gap-3">
        <Button variant="primary" onClick={handleSubmit} isLoading={submitting}>Save Changes</Button>
        <Button variant="outline" onClick={() => router.push(`${ROUTES.PRODUCTION}/${id}`)}>Cancel</Button>
      </div>
    </div>
  );
}
