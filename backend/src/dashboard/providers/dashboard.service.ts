import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PurchaseInvoice } from '@/purchase-invoices/entities/purchase-invoice.entity';
import { SaleInvoice } from '@/sale-invoices/entities/sale-invoice.entity';
import { RepairInvoice } from '@/repair-invoices/entities/repair-invoice.entity';
import { Expense } from '@/expenses/entities/expense.entity';
import { Item } from '@/items/entities/item.entity';
import { Account } from '@/accounts/entities/account.entity';
import { ProductionBatch } from '@/production/entities/production-batch.entity';
import { SoldInverter } from '@/sold-inverters/entities/sold-inverter.entity';
import { Supplier } from '@/suppliers/entities/supplier.entity';
import { Customer } from '@/customers/entities/customer.entity';
import { SupplierPayment } from '@/supplier-payments/entities/supplier-payment.entity';
import { CustomerPayment } from '@/customer-payments/entities/customer-payment.entity';
import { Asset } from '@/assets/entities/asset.entity';
import { handleError } from '@/common/error-handlers/error.handler';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(PurchaseInvoice)
    private readonly purchaseInvoiceRepo: Repository<PurchaseInvoice>,
    @InjectRepository(SaleInvoice)
    private readonly saleInvoiceRepo: Repository<SaleInvoice>,
    @InjectRepository(RepairInvoice)
    private readonly repairInvoiceRepo: Repository<RepairInvoice>,
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(ProductionBatch)
    private readonly productionBatchRepo: Repository<ProductionBatch>,
    @InjectRepository(SoldInverter)
    private readonly soldInverterRepo: Repository<SoldInverter>,
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(SupplierPayment)
    private readonly supplierPaymentRepo: Repository<SupplierPayment>,
    @InjectRepository(CustomerPayment)
    private readonly customerPaymentRepo: Repository<CustomerPayment>,
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    private readonly dataSource: DataSource,
  ) {}

  async getSummary(fromDate?: string, toDate?: string) {
    try {
      const [
        totalPurchaseCost,
        totalExpensesCost,
        totalInStockAmount,
        totalSalePrice,
        totalRepairCost,
        totalSoldInvertersProfit,
        totalAmountToPay,
        totalAmountToReceive,
        totalCurrentBalance,
        totalProductionCost,
        totalAssetAmount,
      ] = await Promise.all([
        this.getTotalPurchaseCost(fromDate, toDate),
        this.getTotalExpensesCost(fromDate, toDate),
        this.getTotalInStockAmount(),
        this.getTotalSalePrice(fromDate, toDate),
        this.getTotalRepairCost(fromDate, toDate),
        this.getTotalSoldInvertersProfit(fromDate, toDate),
        this.getTotalAmountToPay(),
        this.getTotalAmountToReceive(),
        this.getTotalCurrentBalance(),
        this.getTotalProductionCost(fromDate, toDate),
        this.getTotalAssetAmount(),
      ]);

      const overallProfit = totalCurrentBalance + totalAmountToReceive + totalInStockAmount + totalAssetAmount - totalAmountToPay;

      return {
        totalPurchaseCost,
        totalExpensesCost,
        totalInStockAmount,
        totalSalePrice,
        totalRepairCost,
        totalSoldInvertersProfit,
        totalAmountToPay,
        totalAmountToReceive,
        totalCurrentBalance,
        totalProductionCost,
        totalAssetAmount,
        overallProfit,
      };
    } catch (error) {
      handleError(error);
    }
  }

  async getCharts(fromDate?: string, toDate?: string) {
    try {
      const from = fromDate ?? this.defaultFromDate();
      const to = toDate ?? this.defaultToDate();

      const [purchases, sales, expenses, production] = await Promise.all([
        this.getMonthlyPurchases(from, to),
        this.getMonthlySales(from, to),
        this.getMonthlyExpenses(from, to),
        this.getMonthlyProduction(from, to),
      ]);

      const months = this.buildMonthLabels(from, to);

      return {
        months,
        purchases: this.mapToMonths(months, purchases),
        sales: this.mapToMonths(months, sales),
        expenses: this.mapToMonths(months, expenses),
        production: this.mapToMonths(months, production),
      };
    } catch (error) {
      handleError(error);
    }
  }

  private async getTotalPurchaseCost(fromDate?: string, toDate?: string): Promise<number> {
    const qb = this.purchaseInvoiceRepo
      .createQueryBuilder('pi')
      .where('pi.deletedAt IS NULL')
      .select('COALESCE(SUM(CAST(pi.totalAmount AS numeric)), 0)', 'total');

    if (fromDate) qb.andWhere('pi.date >= :fromDate', { fromDate });
    if (toDate) qb.andWhere('pi.date <= :toDate', { toDate });

    const result = await qb.getRawOne<{ total: string }>();
    return Number(result?.total ?? 0);
  }

  private async getTotalExpensesCost(fromDate?: string, toDate?: string): Promise<number> {
    const qb = this.expenseRepo
      .createQueryBuilder('e')
      .where('e.deletedAt IS NULL')
      .select('COALESCE(SUM(CAST(e.amount AS numeric)), 0)', 'total');

    if (fromDate) qb.andWhere('e.date >= :fromDate', { fromDate });
    if (toDate) qb.andWhere('e.date <= :toDate', { toDate });

    const result = await qb.getRawOne<{ total: string }>();
    return Number(result?.total ?? 0);
  }

  private async getTotalInStockAmount(): Promise<number> {
    const result = await this.itemRepo
      .createQueryBuilder('i')
      .where('i.deletedAt IS NULL')
      .select('COALESCE(SUM(CAST(i.totalQuantity AS numeric) * CAST(i.averagePrice AS numeric)), 0)', 'total')
      .getRawOne<{ total: string }>();
    return Number(result?.total ?? 0);
  }

  private async getTotalSalePrice(fromDate?: string, toDate?: string): Promise<number> {
    const qb = this.saleInvoiceRepo
      .createQueryBuilder('si')
      .where('si.deletedAt IS NULL')
      .select('COALESCE(SUM(CAST(si.totalAmount AS numeric)), 0)', 'total');

    if (fromDate) qb.andWhere('si.date >= :fromDate', { fromDate });
    if (toDate) qb.andWhere('si.date <= :toDate', { toDate });

    const result = await qb.getRawOne<{ total: string }>();
    return Number(result?.total ?? 0);
  }

  private async getTotalRepairCost(fromDate?: string, toDate?: string): Promise<number> {
    const qb = this.repairInvoiceRepo
      .createQueryBuilder('ri')
      .where('ri.deletedAt IS NULL AND ri.isCharged = true')
      .select('COALESCE(SUM(CAST(ri.totalAmount AS numeric)), 0)', 'total');

    if (fromDate) qb.andWhere('ri.date >= :fromDate', { fromDate });
    if (toDate) qb.andWhere('ri.date <= :toDate', { toDate });

    const result = await qb.getRawOne<{ total: string }>();
    return Number(result?.total ?? 0);
  }

  private async getTotalSoldInvertersProfit(fromDate?: string, toDate?: string): Promise<number> {
    const qb = this.soldInverterRepo
      .createQueryBuilder('sv')
      .where('sv.deletedAt IS NULL')
      .select('COALESCE(SUM(CAST(sv.profit AS numeric)), 0)', 'total');

    if (fromDate) qb.andWhere('sv.saleDate >= :fromDate', { fromDate });
    if (toDate) qb.andWhere('sv.saleDate <= :toDate', { toDate });

    const result = await qb.getRawOne<{ total: string }>();
    return Number(result?.total ?? 0);
  }

  private async getTotalAmountToPay(): Promise<number> {
    const suppliersResult = await this.supplierRepo
      .createQueryBuilder('s')
      .where('s.deletedAt IS NULL')
      .select('COALESCE(SUM(CAST(s.openingBalance AS numeric)), 0)', 'totalOpening')
      .getRawOne<{ totalOpening: string }>();

    const purchasesResult = await this.purchaseInvoiceRepo
      .createQueryBuilder('pi')
      .where('pi.deletedAt IS NULL')
      .select('COALESCE(SUM(CAST(pi.totalAmount AS numeric)), 0)', 'total')
      .getRawOne<{ total: string }>();

    const paymentsResult = await this.supplierPaymentRepo
      .createQueryBuilder('sp')
      .where('sp.deletedAt IS NULL')
      .select('COALESCE(SUM(CAST(sp.amount AS numeric)), 0)', 'total')
      .getRawOne<{ total: string }>();

    const returnsResult = await this.dataSource
      .createQueryBuilder()
      .select('COALESCE(SUM(CAST(sa."deductionAmount" AS numeric)), 0)', 'total')
      .from('stock_adjustment', 'sa')
      .where('sa."deletedAt" IS NULL AND sa."reason" = :reason', { reason: 'return_to_supplier' })
      .getRawOne<{ total: string }>();

    const totalOpening = Number(suppliersResult?.totalOpening ?? 0);
    const totalPurchases = Number(purchasesResult?.total ?? 0);
    const totalPayments = Number(paymentsResult?.total ?? 0);
    const totalReturns = Number(returnsResult?.total ?? 0);

    return totalOpening + totalPurchases - totalPayments - totalReturns;
  }

  private async getTotalAmountToReceive(): Promise<number> {
    const customersResult = await this.customerRepo
      .createQueryBuilder('c')
      .where('c.deletedAt IS NULL')
      .select('COALESCE(SUM(CAST(c.openingBalance AS numeric)), 0)', 'totalOpening')
      .getRawOne<{ totalOpening: string }>();

    const salesResult = await this.saleInvoiceRepo
      .createQueryBuilder('si')
      .where('si.deletedAt IS NULL')
      .select('COALESCE(SUM(CAST(si.totalAmount AS numeric)), 0)', 'total')
      .getRawOne<{ total: string }>();

    const repairsResult = await this.repairInvoiceRepo
      .createQueryBuilder('ri')
      .where('ri.deletedAt IS NULL AND ri.isCharged = true')
      .select('COALESCE(SUM(CAST(ri.totalAmount AS numeric)), 0)', 'total')
      .getRawOne<{ total: string }>();

    const paymentsResult = await this.customerPaymentRepo
      .createQueryBuilder('cp')
      .where('cp.deletedAt IS NULL')
      .select('COALESCE(SUM(CAST(cp.amount AS numeric)), 0)', 'total')
      .getRawOne<{ total: string }>();

    const totalOpening = Number(customersResult?.totalOpening ?? 0);
    const totalSales = Number(salesResult?.total ?? 0);
    const totalRepairs = Number(repairsResult?.total ?? 0);
    const totalPayments = Number(paymentsResult?.total ?? 0);

    return totalOpening + totalSales + totalRepairs - totalPayments;
  }

  private async getTotalCurrentBalance(): Promise<number> {
    const result = await this.accountRepo
      .createQueryBuilder('a')
      .where('a.deletedAt IS NULL')
      .select('COALESCE(SUM(CAST(a.currentBalance AS numeric)), 0)', 'total')
      .getRawOne<{ total: string }>();
    return Number(result?.total ?? 0);
  }

  private async getTotalProductionCost(fromDate?: string, toDate?: string): Promise<number> {
    const qb = this.productionBatchRepo
      .createQueryBuilder('pb')
      .where('pb.deletedAt IS NULL')
      .select('COALESCE(SUM(CAST(pb.totalCost AS numeric)), 0)', 'total');

    if (fromDate) qb.andWhere('pb.created_at >= :fromDate', { fromDate });
    if (toDate) qb.andWhere('pb.created_at <= :toDate', { toDate });

    const result = await qb.getRawOne<{ total: string }>();
    return Number(result?.total ?? 0);
  }

  private async getTotalAssetAmount(): Promise<number> {
    const result = await this.assetRepo
      .createQueryBuilder('asset')
      .where('asset.deletedAt IS NULL')
      .select('COALESCE(SUM(CAST(asset.amount AS numeric)), 0)', 'total')
      .getRawOne<{ total: string }>();
    return Number(result?.total ?? 0);
  }

  private async getMonthlyPurchases(from: string, to: string): Promise<Array<{ month: string; total: number }>> {
    const rows = await this.dataSource.query<Array<{ month: string; total: string }>>(
      `SELECT TO_CHAR(DATE_TRUNC('month', date::date), 'Mon YYYY') AS month,
              COALESCE(SUM(CAST("totalAmount" AS numeric)), 0) AS total
       FROM purchase_invoice
       WHERE "deletedAt" IS NULL AND date >= $1 AND date <= $2
       GROUP BY DATE_TRUNC('month', date::date)
       ORDER BY DATE_TRUNC('month', date::date)`,
      [from, to],
    );
    return rows.map((r) => ({ month: r.month, total: Number(r.total) }));
  }

  private async getMonthlySales(from: string, to: string): Promise<Array<{ month: string; total: number }>> {
    const rows = await this.dataSource.query<Array<{ month: string; total: string }>>(
      `SELECT TO_CHAR(DATE_TRUNC('month', date::date), 'Mon YYYY') AS month,
              COALESCE(SUM(CAST("totalAmount" AS numeric)), 0) AS total
       FROM sale_invoice
       WHERE "deletedAt" IS NULL AND date >= $1 AND date <= $2
       GROUP BY DATE_TRUNC('month', date::date)
       ORDER BY DATE_TRUNC('month', date::date)`,
      [from, to],
    );
    return rows.map((r) => ({ month: r.month, total: Number(r.total) }));
  }

  private async getMonthlyExpenses(from: string, to: string): Promise<Array<{ month: string; total: number }>> {
    const rows = await this.dataSource.query<Array<{ month: string; total: string }>>(
      `SELECT TO_CHAR(DATE_TRUNC('month', date::date), 'Mon YYYY') AS month,
              COALESCE(SUM(CAST(amount AS numeric)), 0) AS total
       FROM expense
       WHERE "deletedAt" IS NULL AND date >= $1 AND date <= $2
       GROUP BY DATE_TRUNC('month', date::date)
       ORDER BY DATE_TRUNC('month', date::date)`,
      [from, to],
    );
    return rows.map((r) => ({ month: r.month, total: Number(r.total) }));
  }

  private async getMonthlyProduction(from: string, to: string): Promise<Array<{ month: string; total: number }>> {
    const rows = await this.dataSource.query<Array<{ month: string; total: string }>>(
      `SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month,
              COALESCE(SUM(CAST("totalCost" AS numeric)), 0) AS total
       FROM production_batch
       WHERE "deletedAt" IS NULL AND created_at >= $1 AND created_at <= $2
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY DATE_TRUNC('month', created_at)`,
      [from, to],
    );
    return rows.map((r) => ({ month: r.month, total: Number(r.total) }));
  }

  private buildMonthLabels(from: string, to: string): string[] {
    const months: string[] = [];
    const current = new Date(from);
    const end = new Date(to);
    current.setDate(1);
    end.setDate(1);

    while (current <= end) {
      months.push(
        current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      );
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  }

  private mapToMonths(
    months: string[],
    data: Array<{ month: string; total: number }>,
  ): number[] {
    return months.map((m) => {
      const match = data.find((d) => d.month === m);
      return match ? match.total : 0;
    });
  }

  private defaultFromDate(): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split('T')[0];
  }

  private defaultToDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
