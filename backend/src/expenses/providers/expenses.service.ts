import { toCsvBuffer } from '@/common/helpers/csv.helper';
import { handleError } from '@/common/error-handlers/error.handler';
import type { ActiveUserData } from '@/common/interfaces/active-user-data.interface';
import { Account } from '@/accounts/entities/account.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Expense } from '../entities/expense.entity';
import { CreateExpenseDto } from '../dtos/create-expense.dto';
import { UpdateExpenseDto } from '../dtos/update-expense.dto';
import { ExpenseQueryDto } from '../dtos/expense-query.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly repo: Repository<Expense>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: ExpenseQueryDto) {
    try {
      const limit = query.limit || 10;
      const page = query.page || 1;
      const skip = (page - 1) * limit;

      const qb = this.repo
        .createQueryBuilder('expense')
        .leftJoinAndSelect('expense.category', 'category')
        .leftJoinAndSelect('expense.account', 'account')
        .leftJoinAndSelect('expense.createdBy', 'createdBy')
        .orderBy('expense.date', 'DESC')
        .addOrderBy('expense.id', 'DESC');

      if (query.categoryId) {
        qb.andWhere('expense.categoryId = :categoryId', { categoryId: query.categoryId });
      }

      if (query.accountId) {
        qb.andWhere('expense.accountId = :accountId', { accountId: query.accountId });
      }

      if (query.fromDate) {
        qb.andWhere('expense.date >= :fromDate', { fromDate: query.fromDate });
      }

      if (query.toDate) {
        qb.andWhere('expense.date <= :toDate', { toDate: query.toDate });
      }

      if (query.search) {
        qb.andWhere('expense.description ILIKE :search', { search: `%${query.search}%` });
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
      const expense = await this.repo.findOne({
        where: { id },
        relations: ['category', 'account', 'createdBy'],
      });

      if (!expense) {
        throw new NotFoundException(`Expense #${id} not found`);
      }

      return expense;
    } catch (error) {
      handleError(error);
    }
  }

  async createBatch(dto: CreateExpenseDto, activeUser: ActiveUserData) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const saved: Expense[] = [];

      for (const line of dto.expenses) {
        const account = await queryRunner.manager.findOne(Account, { where: { id: line.accountId } });

        if (!account) {
          throw new NotFoundException(`Account #${line.accountId} not found`);
        }

        const expense = queryRunner.manager.create(Expense, {
          date: line.date,
          description: line.description,
          amount: line.amount,
          categoryId: line.categoryId,
          accountId: line.accountId,
          notes: line.notes ?? null,
          createdById: activeUser.id,
        });

        const savedExpense = await queryRunner.manager.save(Expense, expense);
        saved.push(savedExpense);

        await queryRunner.manager.update(Account, { id: line.accountId }, {
          currentBalance: Number(account.currentBalance) - Number(line.amount),
        });
      }

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

  async update(id: number, dto: UpdateExpenseDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const expense = await queryRunner.manager.findOne(Expense, { where: { id } });

      if (!expense) {
        throw new NotFoundException(`Expense #${id} not found`);
      }

      const oldAmount = Number(expense.amount);
      const oldAccountId = expense.accountId;
      const newAmount = dto.amount !== undefined ? Number(dto.amount) : oldAmount;
      const newAccountId = dto.accountId !== undefined ? dto.accountId : oldAccountId;

      // Reverse old account deduction
      const oldAccount = await queryRunner.manager.findOne(Account, { where: { id: oldAccountId } });
      if (!oldAccount) {
        throw new NotFoundException(`Account #${oldAccountId} not found`);
      }
      await queryRunner.manager.update(Account, { id: oldAccountId }, {
        currentBalance: Number(oldAccount.currentBalance) + oldAmount,
      });

      // Apply new account deduction
      const newAccount = await queryRunner.manager.findOne(Account, { where: { id: newAccountId } });
      if (!newAccount) {
        throw new NotFoundException(`Account #${newAccountId} not found`);
      }
      const balanceAfterReverse = newAccountId === oldAccountId
        ? Number(oldAccount.currentBalance) + oldAmount
        : Number(newAccount.currentBalance);

      await queryRunner.manager.update(Account, { id: newAccountId }, {
        currentBalance: balanceAfterReverse - newAmount,
      });

      Object.assign(expense, {
        ...(dto.date !== undefined && { date: dto.date }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.accountId !== undefined && { accountId: dto.accountId }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      });

      const updated = await queryRunner.manager.save(Expense, expense);

      await queryRunner.commitTransaction();

      return updated;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const expense = await queryRunner.manager.findOne(Expense, { where: { id } });

      if (!expense) {
        throw new NotFoundException(`Expense #${id} not found`);
      }

      const account = await queryRunner.manager.findOne(Account, { where: { id: expense.accountId } });

      if (account) {
        await queryRunner.manager.update(Account, { id: expense.accountId }, {
          currentBalance: Number(account.currentBalance) + Number(expense.amount),
        });
      }

      await queryRunner.manager.softDelete(Expense, id);

      await queryRunner.commitTransaction();

      return { message: 'Expense deleted successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getTotalExpenseAmount() {
    try {
      const result = await this.repo
        .createQueryBuilder('expense')
        .where('expense.deletedAt IS NULL')
        .select('COALESCE(SUM(CAST(expense.amount AS numeric)), 0)', 'total')
        .getRawOne<{ total: string }>();

      return { total: Number(result?.total ?? 0) };
    } catch (error) {
      handleError(error);
      throw error;
    }
  }

  async exportCsv() {
    try {
      const expenses = await this.repo.find({
        relations: ['category', 'account', 'createdBy'],
        order: { date: 'DESC' },
      });

      return toCsvBuffer(
        ['Date', 'Description', 'Amount', 'Category', 'Account', 'Notes'],
        expenses.map((e) => ({
          'Date': e.date,
          'Description': e.description,
          'Amount': e.amount,
          'Category': e.category?.name ?? '',
          'Account': e.account?.name ?? '',
          'Notes': e.notes ?? '',
        })),
      );
    } catch (error) {
      handleError(error);
      throw error;
    }
  }
}
