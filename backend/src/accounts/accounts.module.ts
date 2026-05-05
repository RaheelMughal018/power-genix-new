import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { AccountTransfer } from './entities/account-transfer.entity';
import { SupplierPayment } from '@/supplier-payments/entities/supplier-payment.entity';
import { CustomerPayment } from '@/customer-payments/entities/customer-payment.entity';
import { Expense } from '@/expenses/entities/expense.entity';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './providers/accounts.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      AccountTransfer,
      SupplierPayment,
      CustomerPayment,
      Expense,
    ]),
  ],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}
