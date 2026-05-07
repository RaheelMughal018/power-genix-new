'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { SummaryCards } from '@/app/_shared/components/ui/summaryCards/summaryCards';
import { Tabs } from '@/app/_shared/components/ui/tabs/tabs';
import { Button } from '@/app/_shared/components/ui/button/button';
import { Spinner } from '@/app/_shared/components/ui/spinner/spinner';
import { NoContentCard } from '@/app/_shared/components/ui/noContentCard/noContentCard';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { accountsApi } from '@/app/_shared/lib/api/client';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { ROUTES } from '@/app/_shared/lib/config/routes';
import { SupplierPaymentsTab } from './supplierPaymentsTab';
import { CustomerPaymentsTab } from './customerPaymentsTab';
import { ExpensesTab } from './expensesTab';
import { TransfersTab } from './transfersTab';
import { AssetsTab } from './assetsTab';

interface AccountDetail {
  id: number;
  name: string;
  type: string;
  openingBalance: number;
  currentBalance: number;
  totalOut: number;
  totalIn: number;
  supplierPayments: SupplierPaymentRecord[];
  customerPayments: CustomerPaymentRecord[];
  expenses: ExpenseRecord[];
  transfersOut: TransferRecord[];
  transfersIn: TransferRecord[];
  assets: AssetRecord[];
}

export interface SupplierPaymentRecord {
  id: number;
  invoiceNumber: string;
  amount: number;
  date: string;
  notes: string | null;
  supplier: { id: number; name: string };
}

export interface CustomerPaymentRecord {
  id: number;
  invoiceNumber: string;
  amount: number;
  date: string;
  notes: string | null;
  customer: { id: number; name: string };
}

export interface ExpenseRecord {
  id: number;
  description: string;
  amount: number;
  date: string;
  notes: string | null;
  category: { id: number; name: string };
}

export interface TransferRecord {
  id: number;
  amount: number;
  date: string;
  notes: string | null;
  fromAccount?: { id: number; name: string };
  toAccount?: { id: number; name: string };
}

export interface AssetRecord {
  id: number;
  name: string;
  type: string;
  amount: number;
  purchaseDate: string;
  notes: string | null;
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank: 'Bank',
  mobile_wallet: 'Mobile Wallet',
};

export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addToast } = useToast();

  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const response = await accountsApi.getDetail(Number(id));
        const detail = (response.data as { data: AccountDetail }).data;
        setAccount(detail);
      } catch {
        addToast({ title: 'Error', description: 'Failed to load account details', variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, addToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => router.push(ROUTES.ACCOUNTS)}>
          ← Back to Accounts
        </Button>
        <NoContentCard title="Account not found" description="This account could not be loaded." />
      </div>
    );
  }

  const summaryCards = [
    { label: 'Account Type', value: ACCOUNT_TYPE_LABELS[account.type] ?? account.type },
    { label: 'Opening Balance', value: formatPKR(account.openingBalance) },
    { label: 'Total Received', value: formatPKR(account.totalIn) },
    { label: 'Total Spent', value: formatPKR(account.totalOut) },
    { label: 'Current Balance', value: formatPKR(account.currentBalance) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push(ROUTES.ACCOUNTS)}>
          ← Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-(--color-text-primary)">{account.name}</h1>
          <p className="text-(--color-text-secondary)">{ACCOUNT_TYPE_LABELS[account.type] ?? account.type} Account</p>
        </div>
      </div>

      <SummaryCards cards={summaryCards} columns={3} />

      <Tabs defaultTab="received">
        <Tabs.List>
          <Tabs.Tab id="received">Received ({account.customerPayments.length})</Tabs.Tab>
          <Tabs.Tab id="paid">Paid Out ({account.supplierPayments.length})</Tabs.Tab>
          <Tabs.Tab id="expenses">Expenses ({account.expenses.length})</Tabs.Tab>
          <Tabs.Tab id="assets">Assets ({account.assets?.length || 0})</Tabs.Tab>
          <Tabs.Tab id="transfers">Transfers ({account.transfersOut.length + account.transfersIn.length})</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel id="received">
          <CustomerPaymentsTab payments={account.customerPayments} />
        </Tabs.Panel>

        <Tabs.Panel id="paid">
          <SupplierPaymentsTab payments={account.supplierPayments} />
        </Tabs.Panel>

        <Tabs.Panel id="expenses">
          <ExpensesTab expenses={account.expenses} />
        </Tabs.Panel>

        <Tabs.Panel id="assets">
          <AssetsTab assets={account.assets ?? []} />
        </Tabs.Panel>

        <Tabs.Panel id="transfers">
          <TransfersTab
            transfersIn={account.transfersIn}
            transfersOut={account.transfersOut}
            accountName={account.name}
          />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
