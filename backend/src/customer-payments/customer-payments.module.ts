import { Account } from '@/accounts/entities/account.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerPayment } from './entities/customer-payment.entity';
import { CustomerPaymentsController } from './customer-payments.controller';
import { CustomerPaymentsService } from './providers/customer-payments.service';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerPayment, Account])],
  controllers: [CustomerPaymentsController],
  providers: [CustomerPaymentsService],
  exports: [CustomerPaymentsService],
})
export class CustomerPaymentsModule {}
