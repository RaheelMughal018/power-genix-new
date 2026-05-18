import { toCsvBuffer } from '@/common/helpers/csv.helper';
import { handleError } from '@/common/error-handlers/error.handler';
import { generateInvoiceNumber } from '@/common/helpers/invoice-number.helper';
import { applySearch } from '@/common/helpers/search-clause.helper';
import type { ActiveUserData } from '@/common/interfaces/active-user-data.interface';
import { Account } from '@/accounts/entities/account.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateSupplierPaymentDto } from '../dtos/create-supplier-payment.dto';
import { UpdateSupplierPaymentDto } from '../dtos/update-supplier-payment.dto';
import { SupplierPaymentQueryDto } from '../dtos/supplier-payment-query.dto';
import { SupplierPayment } from '../entities/supplier-payment.entity';

@Injectable()
export class SupplierPaymentsService {
  constructor(
    @InjectRepository(SupplierPayment)
    private readonly paymentRepository: Repository<SupplierPayment>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: SupplierPaymentQueryDto) {
    try {
      const limit = query.limit || 10;
      const page = query.page || 1;
      const skip = (page - 1) * limit;

      const qb = this.paymentRepository
        .createQueryBuilder('sp')
        .leftJoinAndSelect('sp.supplier', 'supplier')
        .leftJoinAndSelect('sp.account', 'account')
        .leftJoinAndSelect('sp.createdBy', 'createdBy')
        .orderBy('sp.date', 'DESC')
        .addOrderBy('sp.id', 'DESC');

      if (query.supplierId) {
        qb.andWhere('sp.supplierId = :supplierId', { supplierId: query.supplierId });
      }

      if (query.accountId) {
        qb.andWhere('sp.accountId = :accountId', { accountId: query.accountId });
      }

      applySearch(qb, query.search, {
        text: ['sp.invoiceNumber', 'supplier.name', 'sp.notes', 'account.name'],
        numeric: ['sp.amount'],
        date: ['sp.date'],
      });

      if (query.fromDate) {
        qb.andWhere('sp.date >= :fromDate', { fromDate: query.fromDate });
      }

      if (query.toDate) {
        qb.andWhere('sp.date <= :toDate', { toDate: query.toDate });
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
        relations: ['supplier', 'account', 'createdBy'],
      });

      if (!payment) {
        throw new NotFoundException(`Supplier payment #${id} not found`);
      }

      return payment;
    } catch (error) {
      handleError(error);
    }
  }

  async create(dto: CreateSupplierPaymentDto, activeUser: ActiveUserData) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const invoiceNumber = await generateInvoiceNumber('SP', this.paymentRepository);

      const payment = queryRunner.manager.create(SupplierPayment, {
        invoiceNumber,
        supplierId: dto.supplierId,
        amount: dto.amount,
        accountId: dto.accountId,
        date: dto.date,
        notes: dto.notes ?? null,
        createdById: activeUser.id,
      });

      const saved = await queryRunner.manager.save(SupplierPayment, payment);

      // Deduct amount from account.currentBalance
      const account = await queryRunner.manager.findOne(Account, {
        where: { id: dto.accountId },
      });

      if (!account) {
        throw new NotFoundException(`Account #${dto.accountId} not found`);
      }

      await queryRunner.manager.update(Account, { id: dto.accountId }, {
        currentBalance: Number(account.currentBalance) - dto.amount,
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

  async update(id: number, dto: UpdateSupplierPaymentDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const payment = await queryRunner.manager.findOne(SupplierPayment, { where: { id } });

      if (!payment) {
        throw new NotFoundException(`Supplier payment #${id} not found`);
      }

      // Reverse old: add old amount back to old account
      const oldAccount = await queryRunner.manager.findOne(Account, {
        where: { id: payment.accountId },
      });

      if (!oldAccount) {
        throw new NotFoundException(`Account #${payment.accountId} not found`);
      }

      await queryRunner.manager.update(Account, { id: payment.accountId }, {
        currentBalance: Number(oldAccount.currentBalance) + Number(payment.amount),
      });

      // Apply new: deduct new amount from new account
      const newAccount = await queryRunner.manager.findOne(Account, {
        where: { id: dto.accountId },
      });

      if (!newAccount) {
        throw new NotFoundException(`Account #${dto.accountId} not found`);
      }

      await queryRunner.manager.update(Account, { id: dto.accountId }, {
        currentBalance: Number(newAccount.currentBalance) - dto.amount,
      });

      await queryRunner.manager.update(SupplierPayment, { id }, {
        supplierId: dto.supplierId,
        amount: dto.amount,
        accountId: dto.accountId,
        date: dto.date,
        notes: dto.notes ?? null,
      });

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return this.paymentRepository.findOne({
        where: { id },
        relations: ['supplier', 'account', 'createdBy'],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      handleError(error);
      throw error;
    }
  }

  async getTotalPaidForSupplier(supplierId: number): Promise<number> {
    try {
      const result = await this.paymentRepository
        .createQueryBuilder('sp')
        .where('sp.supplierId = :supplierId AND sp.deletedAt IS NULL', { supplierId })
        .select('COALESCE(SUM(CAST(sp.amount AS numeric)), 0)', 'total')
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
        relations: ['supplier', 'account', 'createdBy'],
        order: { date: 'DESC' },
      });

      return toCsvBuffer(
        ['Date', 'Supplier', 'Amount', 'Account', 'Notes'],
        payments.map((p) => ({
          'Date': p.date,
          'Supplier': p.supplier?.name ?? '',
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
