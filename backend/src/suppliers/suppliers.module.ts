import { PurchaseInvoice } from '@/purchase-invoices/entities/purchase-invoice.entity';
import { SupplierPayment } from '@/supplier-payments/entities/supplier-payment.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supplier } from './entities/supplier.entity';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './providers/suppliers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Supplier, PurchaseInvoice, SupplierPayment])],
  controllers: [SuppliersController],
  providers: [SuppliersService],
  exports: [SuppliersService, TypeOrmModule],
})
export class SuppliersModule {}
