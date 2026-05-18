import { toCsvBuffer } from '@/common/helpers/csv.helper';
import { handleError } from '@/common/error-handlers/error.handler';
import { generateInvoiceNumber } from '@/common/helpers/invoice-number.helper';
import { applySearch } from '@/common/helpers/search-clause.helper';
import type { ActiveUserData } from '@/common/interfaces/active-user-data.interface';
import { Account } from '@/accounts/entities/account.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateCustomerPaymentDto } from '../dtos/create-customer-payment.dto';
import { UpdateCustomerPaymentDto } from '../dtos/update-customer-payment.dto';
import { CustomerPaymentQueryDto } from '../dtos/customer-payment-query.dto';
import { CustomerPayment } from '../entities/customer-payment.entity';

@Injectable()
export class CustomerPaymentsService {
  constructor(
    @InjectRepository(CustomerPayment)
    private readonly paymentRepository: Repository<CustomerPayment>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: CustomerPaymentQueryDto) {
    try {
      const limit = query.limit || 10;
      const page = query.page || 1;
      const skip = (page - 1) * limit;

      const qb = this.paymentRepository
        .createQueryBuilder('cp')
        .leftJoinAndSelect('cp.customer', 'customer')
        .leftJoinAndSelect('cp.account', 'account')
        .leftJoinAndSelect('cp.createdBy', 'createdBy')
        .orderBy('cp.date', 'DESC')
        .addOrderBy('cp.id', 'DESC');

      if (query.customerId) {
        qb.andWhere('cp.customerId = :customerId', { customerId: query.customerId });
      }

      if (query.accountId) {
        qb.andWhere('cp.accountId = :accountId', { accountId: query.accountId });
      }

      applySearch(qb, query.search, {
        text: ['cp.invoiceNumber', 'customer.name', 'cp.notes', 'account.name'],
        numeric: ['cp.amount'],
        date: ['cp.date'],
      });

      if (query.fromDate) {
        qb.andWhere('cp.date >= :fromDate', { fromDate: query.fromDate });
      }

      if (query.toDate) {
        qb.andWhere('cp.date <= :toDate', { toDate: query.toDate });
      }

      const [data, totalItems] = await qb.skip(skip).take(limit).getManyAndCount();

      return {
        data,
        meta: {
          itemsPerPage: limit,
          totalItems,
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
        },
      };
    } catch (error) {
      handleError(error);
    }
  }

  async findOne(id: number) {
    try {
      const payment = await this.paymentRepository.findOne({
        where: { id },
        relations: ['customer', 'account', 'createdBy'],
      });

      if (!payment) {
        throw new NotFoundException(`Customer payment #${id} not found`);
      }

      return payment;
    } catch (error) {
      handleError(error);
    }
  }

  async create(dto: CreateCustomerPaymentDto, activeUser: ActiveUserData) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const invoiceNumber = await generateInvoiceNumber('CP', this.paymentRepository);

      const payment = queryRunner.manager.create(CustomerPayment, {
        invoiceNumber,
        customerId: dto.customerId,
        amount: dto.amount,
        accountId: dto.accountId,
        date: dto.date,
        notes: dto.notes ?? null,
        createdById: activeUser.id,
      });

      const saved = await queryRunner.manager.save(CustomerPayment, payment);

      // Credit amount to account.currentBalance (customer paying us)
      const account = await queryRunner.manager.findOne(Account, {
        where: { id: dto.accountId },
      });

      if (!account) {
        throw new NotFoundException(`Account #${dto.accountId} not found`);
      }

      await queryRunner.manager.update(Account, { id: dto.accountId }, {
        currentBalance: Number(account.currentBalance) + dto.amount,
      });

      await queryRunner.commitTransaction();

      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, dto: UpdateCustomerPaymentDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const payment = await queryRunner.manager.findOne(CustomerPayment, { where: { id } });

      if (!payment) {
        throw new NotFoundException(`Customer payment #${id} not found`);
      }

      // Reverse old: deduct old amount from old account (undo the credit)
      const oldAccount = await queryRunner.manager.findOne(Account, {
        where: { id: payment.accountId },
      });

      if (!oldAccount) {
        throw new NotFoundException(`Account #${payment.accountId} not found`);
      }

      await queryRunner.manager.update(Account, { id: payment.accountId }, {
        currentBalance: Number(oldAccount.currentBalance) - Number(payment.amount),
      });

      // Apply new: credit new amount to new account
      const newAccount = await queryRunner.manager.findOne(Account, {
        where: { id: dto.accountId },
      });

      if (!newAccount) {
        throw new NotFoundException(`Account #${dto.accountId} not found`);
      }

      await queryRunner.manager.update(Account, { id: dto.accountId }, {
        currentBalance: Number(newAccount.currentBalance) + dto.amount,
      });

      await queryRunner.manager.update(CustomerPayment, { id }, {
        customerId: dto.customerId,
        amount: dto.amount,
        accountId: dto.accountId,
        date: dto.date,
        notes: dto.notes ?? null,
      });

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return this.paymentRepository.findOne({
        where: { id },
        relations: ['customer', 'account', 'createdBy'],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      handleError(error);
      throw error;
    }
  }

  async getTotalPaidForCustomer(customerId: number): Promise<number> {
    try {
      const result = await this.paymentRepository
        .createQueryBuilder('cp')
        .where('cp.customerId = :customerId AND cp.deletedAt IS NULL', { customerId })
        .select('COALESCE(SUM(CAST(cp.amount AS numeric)), 0)', 'total')
        .getRawOne<{ total: string }>();

      return Number(result?.total ?? 0);
    } catch (error) {
      handleError(error);
      throw error;
    }
  }

  async exportCsv(): Promise<string> {
    try {
      const payments = await this.paymentRepository.find({
        relations: ['customer', 'account', 'createdBy'],
        order: { date: 'DESC' },
      });

      return toCsvBuffer(
        ['Date', 'Customer', 'Amount', 'Account', 'Notes'],
        payments.map((p) => ({
          'Date': p.date,
          'Customer': p.customer?.name ?? '',
          'Amount': p.amount,
          'Account': p.account?.name ?? '',
          'Notes': p.notes ?? '',
        })),
      );
    } catch (error) {
      handleError(error);
      throw error;
    }
  }
}
