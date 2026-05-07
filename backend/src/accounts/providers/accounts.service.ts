import { toCsvBuffer } from '@/common/helpers/csv.helper';
import { handleError } from '@/common/error-handlers/error.handler';
import { PaginationQueryDto } from '@/common/pagination/dtos/pagination-query.dto';
import type { ActiveUserData } from '@/common/interfaces/active-user-data.interface';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Account } from '../entities/account.entity';
import { AccountTransfer } from '../entities/account-transfer.entity';
import { SupplierPayment } from '@/supplier-payments/entities/supplier-payment.entity';
import { CustomerPayment } from '@/customer-payments/entities/customer-payment.entity';
import { Expense } from '@/expenses/entities/expense.entity';
import { Asset } from '@/assets/entities/asset.entity';
import { CreateAccountDto } from '../dtos/create-account.dto';
import { UpdateAccountDto } from '../dtos/update-account.dto';
import { AddOpeningBalanceDto } from '../dtos/add-opening-balance.dto';
import { TransferDto } from '../dtos/transfer.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectRepository(AccountTransfer)
    private readonly transfersRepository: Repository<AccountTransfer>,
    @InjectRepository(SupplierPayment)
    private readonly supplierPaymentsRepository: Repository<SupplierPayment>,
    @InjectRepository(CustomerPayment)
    private readonly customerPaymentsRepository: Repository<CustomerPayment>,
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
    @InjectRepository(Asset)
    private readonly assetsRepository: Repository<Asset>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(paginationQuery: PaginationQueryDto) {
    try {
      const limit = paginationQuery.limit || 10;
      const page = paginationQuery.page || 1;
      const skip = (page - 1) * limit;

      const qb = this.accountsRepository
        .createQueryBuilder('account')
        .leftJoinAndSelect('account.createdBy', 'createdBy')
        .orderBy('account.name', 'ASC');

      if (paginationQuery.search) {
        qb.andWhere(
          '(account.name ILIKE :search OR account.type::text ILIKE :search)',
          { search: `%${paginationQuery.search}%` },
        );
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
      const account = await this.accountsRepository.findOne({
        where: { id },
        relations: { createdBy: true },
      });

      if (!account) {
        throw new NotFoundException(`Account #${id} not found`);
      }

      return account;
    } catch (error) {
      handleError(error);
    }
  }

  async getTotalBalance() {
    try {
      const result = await this.accountsRepository
        .createQueryBuilder('account')
        .select('SUM(account.currentBalance)', 'total')
        .getRawOne<{ total: string | null }>();

      return { totalBalance: parseFloat(result?.total ?? '0') };
    } catch (error) {
      handleError(error);
    }
  }

  async create(dto: CreateAccountDto, activeUser: ActiveUserData) {
    try {
      const account = this.accountsRepository.create({
        name: dto.name,
        type: dto.type,
        openingBalance: 0,
        currentBalance: 0,
        createdBy: { id: activeUser.id } as any,
      });

      return await this.accountsRepository.save(account);
    } catch (error) {
      handleError(error);
    }
  }

  async update(id: number, dto: UpdateAccountDto) {
    try {
      const account = await this.accountsRepository.findOne({ where: { id } });

      if (!account) {
        throw new NotFoundException(`Account #${id} not found`);
      }

      Object.assign(account, dto);

      return await this.accountsRepository.save(account);
    } catch (error) {
      handleError(error);
    }
  }

  async remove(id: number) {
    try {
      const account = await this.accountsRepository.findOne({ where: { id } });

      if (!account) {
        throw new NotFoundException(`Account #${id} not found`);
      }

      if (Number(account.currentBalance) !== 0) {
        throw new BadRequestException(
          'Cannot delete account with non-zero balance',
        );
      }

      const hasSupplierPayments = await this.supplierPaymentsRepository.count({ where: { accountId: id } });
      const hasCustomerPayments = await this.customerPaymentsRepository.count({ where: { accountId: id } });
      const hasExpenses = await this.expensesRepository.count({ where: { accountId: id } });
      const hasTransfersOut = await this.transfersRepository.count({ where: { fromAccount: { id } } });
      const hasTransfersIn = await this.transfersRepository.count({ where: { toAccount: { id } } });

      if (hasSupplierPayments || hasCustomerPayments || hasExpenses || hasTransfersOut || hasTransfersIn) {
        throw new BadRequestException('Cannot delete account with existing transactions');
      }

      await this.accountsRepository.softDelete(id);

      return { message: 'Account deleted successfully' };
    } catch (error) {
      handleError(error);
    }
  }

  async addOpeningBalance(id: number, dto: AddOpeningBalanceDto) {
    try {
      const account = await this.accountsRepository.findOne({ where: { id } });

      if (!account) {
        throw new NotFoundException(`Account #${id} not found`);
      }

      account.openingBalance = Number(account.openingBalance) + dto.amount;
      account.currentBalance = Number(account.currentBalance) + dto.amount;

      return await this.accountsRepository.save(account);
    } catch (error) {
      handleError(error);
    }
  }

  async transfer(dto: TransferDto, activeUser: ActiveUserData) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const fromAccount = await queryRunner.manager.findOne(Account, {
        where: { id: dto.fromAccountId },
      });

      if (!fromAccount) {
        throw new NotFoundException(`Account #${dto.fromAccountId} not found`);
      }

      const toAccount = await queryRunner.manager.findOne(Account, {
        where: { id: dto.toAccountId },
      });

      if (!toAccount) {
        throw new NotFoundException(`Account #${dto.toAccountId} not found`);
      }

      fromAccount.currentBalance = Number(fromAccount.currentBalance) - dto.amount;
      toAccount.currentBalance = Number(toAccount.currentBalance) + dto.amount;

      await queryRunner.manager.save(Account, fromAccount);
      await queryRunner.manager.save(Account, toAccount);

      const transferDate = dto.date ?? new Date().toISOString().split('T')[0];

      const transfer = queryRunner.manager.create(AccountTransfer, {
        fromAccount: { id: dto.fromAccountId } as any,
        toAccount: { id: dto.toAccountId } as any,
        amount: dto.amount,
        date: transferDate,
        notes: dto.notes ?? null,
        createdBy: { id: activeUser.id } as any,
      });

      await queryRunner.manager.save(AccountTransfer, transfer);

      await queryRunner.commitTransaction();

      return { message: 'Transfer completed successfully', transfer };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
    } finally {
      await queryRunner.release();
    }
  }

  async getDetail(id: number) {
    try {
      const account = await this.accountsRepository.findOne({
        where: { id },
        relations: { createdBy: true },
      });

      if (!account) {
        throw new NotFoundException(`Account #${id} not found`);
      }

      const [supplierPayments, customerPayments, expenses, transfersOut, transfersIn, assets] =
        await Promise.all([
          this.supplierPaymentsRepository.find({
            where: { accountId: id },
            relations: { supplier: true },
            order: { date: 'DESC' },
          }),
          this.customerPaymentsRepository.find({
            where: { accountId: id },
            relations: { customer: true },
            order: { date: 'DESC' },
          }),
          this.expensesRepository.find({
            where: { accountId: id },
            relations: { category: true },
            order: { date: 'DESC' },
          }),
          this.transfersRepository.find({
            where: { fromAccount: { id } },
            relations: { toAccount: true },
            order: { date: 'DESC' },
          }),
          this.transfersRepository.find({
            where: { toAccount: { id } },
            relations: { fromAccount: true },
            order: { date: 'DESC' },
          }),
          this.assetsRepository.find({
            where: { accountId: id },
            order: { purchaseDate: 'DESC' },
          }),
        ]);

      const totalOut =
        supplierPayments.reduce((sum, p) => sum + Number(p.amount), 0) +
        expenses.reduce((sum, e) => sum + Number(e.amount), 0) +
        transfersOut.reduce((sum, t) => sum + Number(t.amount), 0) +
        assets.reduce((sum, a) => sum + Number(a.amount), 0);

      const totalIn =
        customerPayments.reduce((sum, p) => sum + Number(p.amount), 0) +
        transfersIn.reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        ...account,
        totalOut,
        totalIn,
        supplierPayments,
        customerPayments,
        expenses,
        transfersOut,
        transfersIn,
        assets,
      };
    } catch (error) {
      handleError(error);
    }
  }

  async exportCsv() {
    try {
      const accounts = await this.accountsRepository.find({
        order: { name: 'ASC' },
      });

      return toCsvBuffer(
        ['Name', 'Type', 'Opening Balance', 'Current Balance'],
        accounts.map((a) => ({
          'Name': a.name,
          'Type': a.type,
          'Opening Balance': Number(a.openingBalance),
          'Current Balance': Number(a.currentBalance),
        })),
      );
    } catch (error) {
      handleError(error);
    }
  }
}
