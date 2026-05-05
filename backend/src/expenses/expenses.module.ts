import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from './entities/expense.entity';
import { Account } from '@/accounts/entities/account.entity';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './providers/expenses.service';

@Module({
  imports: [TypeOrmModule.forFeature([Expense, Account])],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
