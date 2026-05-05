import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseInvoice } from './entities/purchase-invoice.entity';
import { PurchaseInvoiceItem } from './entities/purchase-invoice-item.entity';
import { PurchaseInvoicesController } from './purchase-invoices.controller';
import { PurchaseInvoicesService } from './providers/purchase-invoices.service';

@Module({
  imports: [TypeOrmModule.forFeature([PurchaseInvoice, PurchaseInvoiceItem])],
  controllers: [PurchaseInvoicesController],
  providers: [PurchaseInvoicesService],
  exports: [PurchaseInvoicesService, TypeOrmModule],
})
export class PurchaseInvoicesModule {}
