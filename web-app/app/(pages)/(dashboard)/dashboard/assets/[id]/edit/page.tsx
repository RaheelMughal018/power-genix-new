'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/app/_shared/components/ui/button/button';
import { Spinner } from '@/app/_shared/components/ui/spinner/spinner';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { assetsApi, accountsApi } from '@/app/_shared/lib/api/client';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import { DateInput } from '@/app/_shared/components/ui/dateInput/dateInput';
import { SearchableDropdown } from '@/app/_shared/components/ui/searchableDropdown/searchableDropdown';

interface DropdownOption { id: number; name: string; }

interface AssetDetail {
  id: number;
  name: string;
  type: string;
  amount: number;
  purchaseDate: string;
  notes: string | null;
  account: { id: number; name: string } | null;
  accountId?: number;
}

const unwrapList = <T,>(res: { data: unknown }): T[] => {
  const raw = res.data as { data?: { data: T[] } } & { data: T[] };
  if (raw.data && Array.isArray((raw.data as { data?: T[] }).data)) return (raw.data as { data: T[] }).data;
  if (Array.isArray(raw.data)) return raw.data;
  return [];
};

const unwrapOne = <T,>(res: { data: unknown }): T => {
  const raw = res.data as { data?: T } & T;
  return ((raw.data as T) || raw) as T;
};

export default function EditAssetPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<DropdownOption[]>([]);

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [amount, setAmount] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [accRes, assetRes] = await Promise.all([
          accountsApi.getAll({ limit: 200 }),
          assetsApi.getById(id),
        ]);

        setAccounts(unwrapList<DropdownOption>(accRes));

        const asset = unwrapOne<AssetDetail>(assetRes);
        setName(asset.name || '');
        setType(asset.type || '');
        setAmount(String(asset.amount || ''));
        setPurchaseDate(asset.purchaseDate?.slice(0, 10) || '');
        setAccountId(String(asset.accountId || asset.account?.id || ''));
        setNotes(asset.notes || '');
      } catch {
        addToast({ title: 'Error', description: 'Failed to load asset', variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSubmit = async () => {
    if (!name.trim() || !type.trim() || !amount || !purchaseDate || !accountId) {
      addToast({ title: 'Error', description: 'Please fill in all required fields', variant: 'error' });
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      addToast({ title: 'Error', description: 'Amount must be a positive number', variant: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await assetsApi.update(id, {
        name: name.trim(),
        type: type.trim(),
        amount: parsedAmount,
        purchaseDate,
        accountId: Number(accountId),
        notes: notes.trim() || undefined,
      });
      addToast({ title: 'Asset updated', variant: 'success' });
      router.push(`${ROUTES.ASSETS}/${id}`);
    } catch {
      addToast({ title: 'Error', description: 'Failed to update asset', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-(--color-text-primary)">Edit Asset</h1>
        <Button variant="outline" onClick={() => router.push(`${ROUTES.ASSETS}/${id}`)}>Back</Button>
      </div>

      <div className="bg-(--color-bg-primary) rounded-xl border border-(--color-border) p-6 space-y-4 max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-(--color-text-primary)">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dell Laptop"
              className="w-full px-3 py-2 rounded-lg border border-(--color-border) bg-(--color-bg-primary) text-(--color-text-primary)"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-(--color-text-primary)">Type *</label>
            <input
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="e.g. Equipment, Vehicle, Furniture"
              className="w-full px-3 py-2 rounded-lg border border-(--color-border) bg-(--color-bg-primary) text-(--color-text-primary)"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-(--color-text-primary)">Amount *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-lg border border-(--color-border) bg-(--color-bg-primary) text-(--color-text-primary)"
            />
          </div>

          <DateInput value={purchaseDate} onChange={setPurchaseDate} label="Purchase Date" required />
        </div>

        <SearchableDropdown
          label="Account"
          required
          value={accountId}
          onChange={(v) => setAccountId(String(v))}
          options={accounts.map((a) => ({ value: a.id, label: a.name }))}
          placeholder="Select account"
        />

        <div className="space-y-1">
          <label className="text-sm font-medium text-(--color-text-primary)">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Optional notes..."
            className="w-full px-3 py-2 rounded-lg border border-(--color-border) bg-(--color-bg-primary) text-(--color-text-primary) resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="primary" onClick={handleSubmit} isLoading={submitting}>Save Changes</Button>
        <Button variant="outline" onClick={() => router.push(`${ROUTES.ASSETS}/${id}`)}>Cancel</Button>
      </div>
    </div>
  );
}
