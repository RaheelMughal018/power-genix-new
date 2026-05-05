import { CustomerPayment } from '@/customer-payments/entities/customer-payment.entity';
import { RepairInvoice } from '@/repair-invoices/entities/repair-invoice.entity';
import { SaleInvoice } from '@/sale-invoices/entities/sale-invoice.entity';
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepairInvoicesModule } from '@/repair-invoices/repair-invoices.module';
import { SaleInvoicesModule } from '@/sale-invoices/sale-invoices.module';
import { Customer } from './entities/customer.entity';
import { CustomersController } from './customers.controller';
import { CustomersService } from './providers/customers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, CustomerPayment, SaleInvoice, RepairInvoice]),
    forwardRef(() => SaleInvoicesModule),
    forwardRef(() => RepairInvoicesModule),
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService, TypeOrmModule],
})
export class CustomersModule {}
