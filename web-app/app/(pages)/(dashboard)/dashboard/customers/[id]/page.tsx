'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { SummaryCards } from '@/app/_shared/components/ui/summaryCards/summaryCards';
import { Tabs } from '@/app/_shared/components/ui/tabs/tabs';
import { Button } from '@/app/_shared/components/ui/button/button';
import { NoContentCard } from '@/app/_shared/components/ui/noContentCard/noContentCard';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { customersApi } from '@/app/_shared/lib/api/client';
import { SaleHistoryTab } from './saleHistoryTab';
import { RepairHistoryTab } from './repairHistoryTab';
import { CustomerPaymentHistoryTab } from './customerPaymentHistoryTab';
import { CustomerStatementTab } from './statementTab';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import { ROUTES } from '@/app/_shared/lib/config/routes';

interface CustomerDetail {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  openingBalance: number;
  totalSaleAmount: number;
  totalRepairAmount: number;
  totalPaymentReceived: number;
  outstandingBalance: number;
  currentBalance: number;
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addToast } = useToast();

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const response = await customersApi.getDetail(Number(id));
        const detail = (response.data as { data: CustomerDetail }).data;
        setCustomer(detail);
      } catch {
        addToast({ title: 'Error', description: 'Failed to load customer details', variant: 'error' });
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

  if (!customer) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => router.push(ROUTES.CUSTOMERS)}>
          ← Back to Customers
        </Button>
        <NoContentCard title="Customer not found" description="This customer could not be loaded." />
      </div>
    );
  }

  const summaryCards = [
    { label: 'Opening Balance', value: formatPKR(customer.openingBalance) },
    { label: 'Total Sale Amount', value: formatPKR(customer.totalSaleAmount ?? 0) },
    { label: 'Total Repair Amount', value: formatPKR(customer.totalRepairAmount ?? 0) },
    { label: 'Total Payment Received', value: formatPKR(customer.totalPaymentReceived ?? 0) },
    { label: 'Outstanding Balance', value: formatPKR(customer.outstandingBalance ?? 0) },
    { label: 'Current Balance', value: formatPKR(customer.currentBalance ?? 0) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push(ROUTES.CUSTOMERS)}>
          ← Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-(--color-text-primary)">{customer.name}</h1>
          <p className="text-(--color-text-secondary)">
            {[customer.phone, customer.email].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      <SummaryCards cards={summaryCards} columns={3} />

      <Tabs defaultTab="sales">
        <Tabs.List>
          <Tabs.Tab id="sales">Sale History</Tabs.Tab>
          <Tabs.Tab id="repairs">Repair History</Tabs.Tab>
          <Tabs.Tab id="payments">Payment History</Tabs.Tab>
          <Tabs.Tab id="statement">Statement</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel id="sales">
          <SaleHistoryTab customerId={customer.id} />
        </Tabs.Panel>

        <Tabs.Panel id="repairs">
          <RepairHistoryTab customerId={customer.id} />
        </Tabs.Panel>

        <Tabs.Panel id="payments">
          <CustomerPaymentHistoryTab customerId={customer.id} />
        </Tabs.Panel>

        <Tabs.Panel id="statement">
          <CustomerStatementTab customerId={customer.id} />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
