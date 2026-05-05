import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepairInvoice } from './entities/repair-invoice.entity';
import { RepairInvoiceItem } from './entities/repair-invoice-item.entity';
import { RepairInvoicesController } from './repair-invoices.controller';
import { RepairInvoicesService } from './providers/repair-invoices.service';

@Module({
  imports: [TypeOrmModule.forFeature([RepairInvoice, RepairInvoiceItem])],
  controllers: [RepairInvoicesController],
  providers: [RepairInvoicesService],
  exports: [RepairInvoicesService, TypeOrmModule],
})
export class RepairInvoicesModule {}
