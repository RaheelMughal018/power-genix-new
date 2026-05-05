import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SoldInvertersModule } from '@/sold-inverters/sold-inverters.module';
import { ProductionUnit } from '@/production/entities/production-unit.entity';
import { SaleInvoice } from './entities/sale-invoice.entity';
import { SaleInvoiceItem } from './entities/sale-invoice-item.entity';
import { SaleInvoicesController } from './sale-invoices.controller';
import { SaleInvoicesService } from './providers/sale-invoices.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SaleInvoice, SaleInvoiceItem, ProductionUnit]),
    SoldInvertersModule,
  ],
  controllers: [SaleInvoicesController],
  providers: [SaleInvoicesService],
  exports: [SaleInvoicesService, TypeOrmModule],
})
export class SaleInvoicesModule {}
