'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { productionApi } from '@/app/_shared/lib/api/client';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { Button } from '@/app/_shared/components/ui/button/button';
import { Spinner } from '@/app/_shared/components/ui/spinner/spinner';
import { StatusBadge } from '@/app/_shared/components/ui/statusBadge/statusBadge';
import { ConfirmDialog } from '@/app/_shared/components/ui/confirmDialog/confirmDialog';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import { formatPKR } from '@/app/_shared/lib/utils/currency';

interface BomAggRow { itemId: number; itemName: string; unit: string; totalQty: number; unitPrice: number; }
interface RecipeItem { id: number; item: { id: number; name: string; averagePrice: number; unit: string }; quantity: number; }
interface UnitItem { id: number; item: { id: number; name: string; unit?: string; averagePrice?: number }; quantity: number; unitPrice: number; }
interface Unit { id: number; serialNumber: string; unitCost: number; productionUnitItems: UnitItem[]; items?: UnitItem[]; }
interface BatchDetail {
  id: number; batchNumber: string; quantity: number; status: string;
  totalCost: number; copperAmount: number; notes: string;
  recipe: { id: number; name: string; additionalExpense?: number; finalProduct: { id: number; name: string }; recipeItems?: RecipeItem[] };
  copperAccount: { id: number; name: string } | null;
  productionUnits?: Unit[];
  units?: Unit[];
  createdBy: { firstName: string; lastName: string };
  created_at: string;
}

function aggregateBomItems(units: Unit[]): BomAggRow[] {
  const map = new Map<number, BomAggRow>();
  for (const unit of units) {
    for (const ui of (unit.productionUnitItems || unit.items || [])) {
      const itemId = ui.item?.id ?? 0;
      const existing = map.get(itemId);
      if (existing) {
        existing.totalQty += Number(ui.quantity);
      } else {
        map.set(itemId, {
          itemId,
          itemName: ui.item?.name ?? '-',
          unit: ui.item?.unit ?? '',
          totalQty: Number(ui.quantity),
          unitPrice: Number(ui.unitPrice),
        });
      }
    }
  }
  return Array.from(map.values());
}

function hasPriceMismatch(units: Unit[]): boolean {
  for (const unit of units) {
    for (const ui of (unit.productionUnitItems || unit.items || [])) {
      const current = Number(ui.item?.averagePrice ?? NaN);
      if (!Number.isNaN(current) && current !== Number(ui.unitPrice)) {
        return true;
      }
    }
  }
  return false;
}

export default function ProductionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addToast } = useToast();
  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const [shortfall, setShortfall] = useState<Array<{ itemName: string; required: number; available: number }>>([]);

  const fetchBatch = async () => {
    try {
      const res = await productionApi.getById(Number(id));
      const raw = res.data as { data?: BatchDetail } & BatchDetail;
      setBatch((raw.data || raw) as BatchDetail);
    } catch {
      addToast({ title: 'Error', description: 'Failed to load batch', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleComplete = async () => {
    setIsCompleting(true);
    setShortfall([]);
    try {
      const res = await productionApi.complete(Number(id));
      const raw = res.data as { data?: { success: boolean; shortfall?: Array<{ itemName: string; required: number; available: number }> } };
      const result = raw.data || raw;
      if ((result as { success?: boolean }).success === false) {
        setShortfall((result as { shortfall?: Array<{ itemName: string; required: number; available: number }> }).shortfall || []);
        addToast({ title: 'Insufficient Stock', description: 'Check shortfall details below', variant: 'warning' });
      } else {
        addToast({ title: 'Success', description: 'Batch completed — stock updated', variant: 'success' });
        router.push(ROUTES.PRODUCTION);
      }
    } catch {
      addToast({ title: 'Error', description: 'Failed to complete batch', variant: 'error' });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleRefreshPrices = async () => {
    setIsRefreshingPrices(true);
    try {
      const res = await productionApi.refreshPrices(Number(id));
      const raw = res.data as { data?: { message?: string; updatedItems?: number } } & { message?: string; updatedItems?: number };
      const result = raw.data || raw;
      addToast({
        title: 'Prices Refreshed',
        description: result.message || 'Updated to latest average prices',
        variant: 'success',
      });
      await fetchBatch();
    } catch {
      addToast({ title: 'Error', description: 'Failed to refresh prices', variant: 'error' });
    } finally {
      setIsRefreshingPrices(false);
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await productionApi.cancel(Number(id));
      addToast({ title: 'Success', description: 'Batch cancelled', variant: 'success' });
      router.push(ROUTES.PRODUCTION);
    } catch {
      addToast({ title: 'Error', description: 'Failed to cancel', variant: 'error' });
    } finally {
      setIsCancelling(false);
      setIsCancelOpen(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!batch) return <p className="text-(--color-text-secondary) text-center py-12">Batch not found</p>;

  const copperPerUnit = batch.quantity > 0 ? batch.copperAmount / batch.quantity : 0;
  const recipeExpense = Number(batch.recipe?.additionalExpense) || 0;
  const costPerUnit = batch.quantity > 0 ? batch.totalCost / batch.quantity : 0;
  const allUnits = batch.productionUnits || batch.units || [];
  const pricesStale = batch.status === 'pending' && hasPriceMismatch(allUnits);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-(--color-text-secondary) uppercase tracking-wide mb-1">Production Batch</p>
          <h1 className="text-3xl font-bold text-(--color-text-primary)">{batch.batchNumber}</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          {batch.status === 'pending' && (
            <>
              {pricesStale ? (
                <Button variant="primary" onClick={handleRefreshPrices} isLoading={isRefreshingPrices}>Refresh Prices</Button>
              ) : (
                <Button variant="primary" onClick={handleComplete} isLoading={isCompleting}>Complete</Button>
              )}
              <Button variant="outline" onClick={() => router.push(`${ROUTES.PRODUCTION}/${batch.id}/edit`)}>Edit</Button>
              <Button variant="danger" onClick={() => setIsCancelOpen(true)}>Cancel Batch</Button>
            </>
          )}
          <Button variant="outline" onClick={() => router.push(ROUTES.PRODUCTION)}>← Back</Button>
        </div>
      </div>

      <div className="border-l-4 border-[var(--color-primary-500)] bg-(--color-bg-secondary) rounded-lg border border-(--color-border) p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-[10px] text-(--color-text-secondary) uppercase tracking-widest font-medium mb-1">Recipe</p>
            <p className="text-sm font-semibold text-(--color-text-primary)">{batch.recipe?.name}</p>
          </div>
          <div>
            <p className="text-[10px] text-(--color-text-secondary) uppercase tracking-widest font-medium mb-1">Final Product</p>
            <p className="text-sm font-semibold text-(--color-text-primary)">{batch.recipe?.finalProduct?.name}</p>
          </div>
          <div>
            <p className="text-[10px] text-(--color-text-secondary) uppercase tracking-widest font-medium mb-1">Quantity</p>
            <p className="text-sm font-semibold text-(--color-text-primary)">{batch.quantity} units</p>
          </div>
          <div>
            <p className="text-[10px] text-(--color-text-secondary) uppercase tracking-widest font-medium mb-1">Status</p>
            <StatusBadge status={batch.status as 'pending' | 'completed' | 'cancelled'} />
          </div>
          <div>
            <p className="text-[10px] text-(--color-text-secondary) uppercase tracking-widest font-medium mb-1">Total Cost</p>
            <p className="text-sm font-bold text-(--color-primary-600)">{formatPKR(batch.totalCost)}</p>
          </div>
          <div>
            <p className="text-[10px] text-(--color-text-secondary) uppercase tracking-widest font-medium mb-1">Avg Cost / Unit</p>
            <p className="text-sm font-semibold text-(--color-text-primary)">{formatPKR(costPerUnit)}</p>
          </div>
          <div>
            <p className="text-[10px] text-(--color-text-secondary) uppercase tracking-widest font-medium mb-1">Copper Amount</p>
            <p className="text-sm font-semibold text-(--color-text-primary)">{formatPKR(batch.copperAmount)}</p>
            {batch.copperAccount && <p className="text-[10px] text-(--color-text-tertiary)">From: {batch.copperAccount.name}</p>}
          </div>
          <div>
            <p className="text-[10px] text-(--color-text-secondary) uppercase tracking-widest font-medium mb-1">Copper / Unit</p>
            <p className="text-sm font-semibold text-(--color-text-primary)">{formatPKR(copperPerUnit)}</p>
          </div>
          {recipeExpense > 0 && (
            <div>
              <p className="text-[10px] text-(--color-text-secondary) uppercase tracking-widest font-medium mb-1">Recipe Expense (per unit)</p>
              <p className="text-sm font-semibold text-(--color-text-primary)">{formatPKR(recipeExpense)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="p-3 rounded-lg border border-(--color-border) bg-(--color-bg-primary)">
          <p className="text-[10px] text-(--color-text-secondary) uppercase tracking-widest font-medium mb-1">Created By</p>
          <p className="font-medium text-(--color-text-primary)">{batch.createdBy?.firstName} {batch.createdBy?.lastName}</p>
        </div>
        <div className="p-3 rounded-lg border border-(--color-border) bg-(--color-bg-primary)">
          <p className="text-[10px] text-(--color-text-secondary) uppercase tracking-widest font-medium mb-1">Created At</p>
          <p className="font-medium text-(--color-text-primary)">{new Date(batch.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {pricesStale && (
        <div className="p-4 rounded-lg border border-(--color-warning-500) bg-(--color-warning-50)">
          <h3 className="font-semibold text-(--color-warning-600) mb-1">Prices Out of Date</h3>
          <p className="text-sm text-(--color-warning-600)">
            One or more raw material average prices have changed since this batch was created. Refresh prices before completing the batch so the production cost reflects current values.
          </p>
        </div>
      )}

      {shortfall.length > 0 && (
        <div className="p-4 rounded-lg border border-(--color-error-500) bg-(--color-error-50)">
          <h3 className="font-semibold text-(--color-error-700) mb-2">Insufficient Stock</h3>
          <div className="space-y-1">
            {shortfall.map((s, i) => (
              <p key={i} className="text-sm text-(--color-error-600)">
                <span className="font-medium">{s.itemName}</span>: need {s.required}, available {s.available}
              </p>
            ))}
          </div>
        </div>
      )}

      {(() => {
        const bomItems = aggregateBomItems(allUnits);
        if (bomItems.length === 0) return null;
        return (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-(--color-text-primary)">
              Bill of Materials
            </h2>
            <div className="border border-(--color-border) rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-(--color-bg-secondary)">
                  <tr>
                    <th className="text-left px-4 py-3 text-(--color-text-secondary) font-semibold w-12">#</th>
                    <th className="text-left px-4 py-3 text-(--color-text-secondary) font-semibold">Item</th>
                    <th className="text-center px-4 py-3 text-(--color-text-secondary) font-semibold">Unit</th>
                    <th className="text-right px-4 py-3 text-(--color-text-secondary) font-semibold">Total Qty</th>
                    <th className="text-right px-4 py-3 text-(--color-text-secondary) font-semibold">Unit Price</th>
                    <th className="text-right px-4 py-3 text-(--color-text-secondary) font-semibold">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {bomItems.map((bi, idx) => (
                      <tr key={bi.itemId} className={[
                        'border-t border-(--color-border)',
                        idx % 2 === 1 ? 'bg-[var(--color-bg-tertiary)]' : '',
                      ].filter(Boolean).join(' ')}>
                        <td className="px-4 py-3 text-(--color-text-secondary)">{idx + 1}</td>
                        <td className="px-4 py-3 text-(--color-text-primary) font-medium">{bi.itemName}</td>
                        <td className="px-4 py-3 text-center text-(--color-text-secondary) uppercase text-xs">{bi.unit}</td>
                        <td className="px-4 py-3 text-right text-(--color-text-primary)">{bi.totalQty}</td>
                        <td className="px-4 py-3 text-right text-(--color-text-primary)">{formatPKR(bi.unitPrice)}</td>
                        <td className="px-4 py-3 text-right font-medium text-(--color-text-primary)">{formatPKR(bi.unitPrice * bi.totalQty)}</td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {allUnits.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-(--color-text-primary)">
            Production Units ({allUnits.length})
          </h2>
          {allUnits.map((unit, unitIdx) => {
            const unitItems = unit.productionUnitItems || unit.items || [];
            return (
              <div key={unit.id} className="bg-(--color-bg-primary) border border-(--color-border) rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-(--color-bg-secondary) border-b border-(--color-border)">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-(--color-text-tertiary) bg-(--color-bg-primary) border border-(--color-border) rounded px-2 py-0.5">
                      #{unitIdx + 1}
                    </span>
                    <span className="font-semibold text-(--color-text-primary)">{unit.serialNumber}</span>
                  </div>
                  <span className="text-sm font-bold text-(--color-primary-600)">{formatPKR(unit.unitCost)}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-(--color-border)">
                        <th className="text-left px-5 py-2 text-xs font-semibold text-(--color-text-secondary) uppercase">Item</th>
                        <th className="text-right px-5 py-2 text-xs font-semibold text-(--color-text-secondary) uppercase">Qty</th>
                        <th className="text-right px-5 py-2 text-xs font-semibold text-(--color-text-secondary) uppercase">Unit Price</th>
                        <th className="text-right px-5 py-2 text-xs font-semibold text-(--color-text-secondary) uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unitItems.map((ui) => (
                        <tr key={ui.id} className="border-b border-(--color-border) last:border-0">
                          <td className="px-5 py-2.5 text-(--color-text-primary)">{ui.item?.name}</td>
                          <td className="px-5 py-2.5 text-right text-(--color-text-primary)">{ui.quantity}</td>
                          <td className="px-5 py-2.5 text-right text-(--color-text-primary)">{formatPKR(Number(ui.unitPrice))}</td>
                          <td className="px-5 py-2.5 text-right font-medium text-(--color-text-primary)">{formatPKR(ui.quantity * Number(ui.unitPrice))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {batch.notes && (
        <div className="bg-(--color-bg-secondary) rounded-lg border border-(--color-border) p-4">
          <p className="text-[10px] text-(--color-text-secondary) uppercase tracking-widest font-medium mb-1">Notes</p>
          <p className="text-sm text-(--color-text-primary)">{batch.notes}</p>
        </div>
      )}

      <ConfirmDialog
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={handleCancel}
        title="Cancel Batch"
        message="Cancel this production batch? This cannot be undone."
        confirmLabel="Cancel Batch"
        isLoading={isCancelling}
        variant="warning"
      />
    </div>
  );
}
