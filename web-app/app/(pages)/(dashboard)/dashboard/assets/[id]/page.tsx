'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/_shared/components/ui/button/button';
import { Spinner } from '@/app/_shared/components/ui/spinner/spinner';
import { NoContentCard } from '@/app/_shared/components/ui/noContentCard/noContentCard';
import { ConfirmDialog } from '@/app/_shared/components/ui/confirmDialog/confirmDialog';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { assetsApi } from '@/app/_shared/lib/api/client';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { formatDate } from '@/app/_shared/lib/utils/date';
import { ROUTES } from '@/app/_shared/lib/config/routes';

interface AssetDetail {
  id: number;
  name: string;
  type: string;
  amount: number;
  purchaseDate: string;
  notes: string | null;
  account: { id: number; name: string } | null;
  createdBy: { id: number; firstName: string; lastName: string } | null;
}

const unwrapOne = <T,>(res: { data: unknown }): T => {
  const raw = res.data as { data?: T } & T;
  return ((raw.data as T) || raw) as T;
};

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addToast } = useToast();

  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await assetsApi.getById(Number(id));
        setAsset(unwrapOne<AssetDetail>(res));
      } catch {
        addToast({ title: 'Error', description: 'Failed to load asset', variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, addToast]);

  const handleDeleteConfirm = async () => {
    if (!asset) return;
    setIsDeleting(true);
    try {
      await assetsApi.remove(asset.id);
      addToast({ title: 'Asset deleted', variant: 'success' });
      router.push(ROUTES.ASSETS);
    } catch {
      addToast({ title: 'Error', description: 'Failed to delete asset', variant: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => router.push(ROUTES.ASSETS)}>
          ← Back to Assets
        </Button>
        <NoContentCard title="Asset not found" description="This asset could not be loaded." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push(ROUTES.ASSETS)}>
          ← Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-(--color-text-primary)">{asset.name}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-(--color-bg-secondary) text-(--color-text-secondary) border border-(--color-border)">
              {asset.type}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`${ROUTES.ASSETS}/${asset.id}/edit`)}
          >
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => setIsDeleteDialogOpen(true)}>
            Delete
          </Button>
        </div>
      </div>

      <div className="bg-(--color-bg-primary) rounded-xl border border-(--color-border) p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-1">
            <p className="text-xs font-medium text-(--color-text-secondary) uppercase tracking-wider">Amount</p>
            <p className="text-lg font-bold text-(--color-primary-600)">{formatPKR(asset.amount)}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-(--color-text-secondary) uppercase tracking-wider">Purchase Date</p>
            <p className="text-sm text-(--color-text-primary)">{formatDate(asset.purchaseDate)}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-(--color-text-secondary) uppercase tracking-wider">Account</p>
            {asset.account ? (
              <Link
                href={`${ROUTES.ACCOUNT_DETAIL}/${asset.account.id}`}
                className="text-sm text-(--color-primary) hover:underline font-medium"
              >
                {asset.account.name}
              </Link>
            ) : (
              <p className="text-sm text-(--color-text-primary)">—</p>
            )}
          </div>

          {asset.notes && (
            <div className="space-y-1 sm:col-span-2 lg:col-span-3">
              <p className="text-xs font-medium text-(--color-text-secondary) uppercase tracking-wider">Notes</p>
              <p className="text-sm text-(--color-text-primary)">{asset.notes}</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Asset"
        message={`Are you sure you want to delete "${asset.name}"? The amount will be refunded to the account.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
