import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './providers/dashboard.service';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseInvoice,
      SaleInvoice,
      RepairInvoice,
      Expense,
      Item,
      Account,
      ProductionBatch,
      SoldInverter,
      Supplier,
      Customer,
      SupplierPayment,
      CustomerPayment,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
