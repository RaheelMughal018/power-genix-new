'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { SummaryCards } from '@/app/_shared/components/ui/summaryCards/summaryCards';
import { Tabs } from '@/app/_shared/components/ui/tabs/tabs';
import { Button } from '@/app/_shared/components/ui/button/button';
import { NoContentCard } from '@/app/_shared/components/ui/noContentCard/noContentCard';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { suppliersApi } from '@/app/_shared/lib/api/client';
import { PurchaseHistoryTab } from './purchaseHistoryTab';
import { PaymentHistoryTab } from './paymentHistoryTab';
import { StatementTab } from './statementTab';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { ROUTES } from '@/app/_shared/lib/config/routes';

interface SupplierDetail {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  openingBalance: number;
  totalPurchaseAmount: number;
  totalPaidAmount: number;
  outstandingBalance: number;
  currentBalance: number;
}

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addToast } = useToast();

  const [supplier, setSupplier] = useState<SupplierDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const response = await suppliersApi.getDetail(Number(id));
        const detail = (response.data as { data: SupplierDetail }).data;
        setSupplier(detail);
      } catch {
        addToast({ title: 'Error', description: 'Failed to load supplier details', variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, addToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-(--color-text-secondary)">Loading...</span>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => router.push(ROUTES.SUPPLIERS)}>
          ← Back to Suppliers
        </Button>
        <NoContentCard title="Supplier not found" description="This supplier could not be loaded." />
      </div>
    );
  }

  const summaryCards = [
    { label: 'Opening Balance', value: formatPKR(supplier.openingBalance) },
    { label: 'Total Purchase Amount', value: formatPKR(supplier.totalPurchaseAmount ?? 0) },
    { label: 'Total Paid Amount', value: formatPKR(supplier.totalPaidAmount ?? 0) },
    { label: 'Outstanding Balance', value: formatPKR(supplier.outstandingBalance ?? 0) },
    { label: 'Current Balance', value: formatPKR(supplier.currentBalance ?? 0) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push(ROUTES.SUPPLIERS)}>
          ← Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-(--color-text-primary)">{supplier.name}</h1>
          <p className="text-(--color-text-secondary)">
            {[supplier.phone, supplier.email].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      <SummaryCards cards={summaryCards} columns={3} />

      <Tabs defaultTab="purchases">
        <Tabs.List>
          <Tabs.Tab id="purchases">Purchase History</Tabs.Tab>
          <Tabs.Tab id="payments">Payment History</Tabs.Tab>
          <Tabs.Tab id="statement">Statement</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel id="purchases">
          <PurchaseHistoryTab supplierId={supplier.id} />
        </Tabs.Panel>

        <Tabs.Panel id="payments">
          <PaymentHistoryTab supplierId={supplier.id} />
        </Tabs.Panel>

        <Tabs.Panel id="statement">
          <StatementTab supplierId={supplier.id} />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
