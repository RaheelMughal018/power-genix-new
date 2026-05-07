'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DataTable, type Column } from '@/app/_shared/components/ui/dataTable/dataTable';
import { ConfirmDialog } from '@/app/_shared/components/ui/confirmDialog/confirmDialog';
import { Button } from '@/app/_shared/components/ui/button/button';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { assetsApi, accountsApi } from '@/app/_shared/lib/api/client';
import { DateRangeSelector } from '@/app/_shared/components/ui/dateSelector/dateRangeSelector';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import { SearchableDropdown } from '@/app/_shared/components/ui/searchableDropdown/searchableDropdown';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { formatDate } from '@/app/_shared/lib/utils/date';
import { downloadCsv } from '@/app/_shared/lib/utils/download';

interface Asset extends Record<string, unknown> {
  id: number;
  name: string;
  type: string;
  amount: number;
  purchaseDate: string;
  account: { id: number; name: string } | null;
  notes: string | null;
}

interface AssetsResponse {
  data: Asset[];
  meta: { totalItems: number; currentPage: number; totalPages: number; itemsPerPage: number };
}

interface FilterOption { id: number; name: string; }

const LIMIT = 10;

const unwrapList = <T,>(res: { data: unknown }): T[] => {
  const raw = res.data as { data?: { data: T[] } } & { data: T[] };
  if (raw.data && Array.isArray((raw.data as { data?: T[] }).data)) return (raw.data as { data: T[] }).data;
  if (Array.isArray(raw.data)) return raw.data;
  return [];
};

export default function AssetsPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  const [accountId, setAccountId] = useState<number | undefined>();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [accounts, setAccounts] = useState<FilterOption[]>([]);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const accRes = await accountsApi.getAll({ limit: 200 });
        setAccounts(unwrapList<FilterOption>(accRes));
      } catch {
        // non-critical
      }
    };
    loadFilters();
  }, []);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const [assetRes, totalRes] = await Promise.all([
        assetsApi.getAll({
          page, limit: LIMIT,
          search: search || undefined,
          accountId,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        }),
        assetsApi.getTotal(),
      ]);

      const raw = assetRes.data as { data?: AssetsResponse } & AssetsResponse;
      const resData = raw.data && 'data' in raw.data ? raw.data as AssetsResponse : raw;
      setAssets(Array.isArray(resData.data) ? resData.data : []);
      setTotalPages(resData.meta?.totalPages ?? 1);
      setTotalItems(resData.meta?.totalItems ?? 0);

      const totalRaw = totalRes.data as { data?: { total: number } } & { total: number };
      const totalData = totalRaw.data && 'total' in totalRaw.data ? totalRaw.data : totalRaw;
      setTotalAmount(Number(totalData.total ?? 0));
    } catch {
      addToast({ title: 'Error', description: 'Failed to load assets', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, accountId, fromDate, toDate, addToast]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDeleteClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAsset) return;
    setIsDeleting(true);
    try {
      await assetsApi.remove(selectedAsset.id);
      addToast({ title: 'Asset deleted', variant: 'success' });
      setIsDeleteDialogOpen(false);
      setSelectedAsset(null);
      fetchAssets();
    } catch {
      addToast({ title: 'Error', description: 'Failed to delete asset', variant: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      await downloadCsv('/assets/export/csv', 'assets.csv');
    } catch {
      addToast({ title: 'Error', description: 'Failed to export CSV', variant: 'error' });
    }
  };

  const columns: Column<Asset>[] = [
    {
      key: 'name',
      label: 'Name',
      render: (row) => (
        <Link
          href={`${ROUTES.ASSETS}/${row.id}`}
          className="text-(--color-primary) hover:underline cursor-pointer font-medium"
        >
          {row.name}
        </Link>
      ),
    },
    { key: 'type', label: 'Type' },
    { key: 'amount', label: 'Amount', render: (row) => formatPKR(row.amount) },
    { key: 'purchaseDate', label: 'Purchase Date', render: (row) => formatDate(row.purchaseDate) },
    { key: 'account', label: 'Account', render: (row) => row.account?.name || '—' },
    {
      key: 'actions',
      label: 'Actions',
      width: '140px',
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => router.push(`${ROUTES.ASSETS}/${row.id}/edit`)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDeleteClick(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const footerRow = (
    <tr>
      <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-(--color-text-primary)">Total</td>
      <td className="px-4 py-3 text-sm font-bold text-(--color-primary-600)">{formatPKR(totalAmount)}</td>
      <td colSpan={3} />
    </tr>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-(--color-text-primary)">Assets</h1>
        <p className="text-(--color-text-secondary)">Track business assets purchased from accounts</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchableDropdown
          options={accounts.map((a) => ({ value: a.id, label: a.name }))}
          value={accountId || ''}
          onChange={(v) => { setAccountId(v ? Number(v) : undefined); setPage(1); }}
          placeholder="All Accounts"
        />
      </div>

      <DateRangeSelector
        from={fromDate}
        to={toDate}
        onChange={(range) => {
          setFromDate(range?.from ?? '');
          setToDate(range?.to ?? '');
          setPage(1);
        }}
      />

      <DataTable<Asset>
        columns={columns}
        data={assets}
        isLoading={loading}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search assets..."
        onExportCsv={handleExportCsv}
        footerRow={footerRow}
        actions={
          <Button size="sm" variant="primary" onClick={() => router.push(ROUTES.ASSET_CREATE)}>
            Add Asset
          </Button>
        }
        emptyTitle="No assets yet"
        emptyDescription="Add your first asset to get started."
        emptyAction={
          <Button size="sm" variant="primary" onClick={() => router.push(ROUTES.ASSET_CREATE)}>
            Add Asset
          </Button>
        }
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedAsset(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Asset"
        message={`Are you sure you want to delete "${selectedAsset?.name}"? The amount will be refunded to the account.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
