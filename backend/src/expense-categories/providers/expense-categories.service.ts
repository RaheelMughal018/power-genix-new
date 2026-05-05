import { handleError } from '@/common/error-handlers/error.handler';
import { PaginationProvider } from '@/common/pagination/providers/pagination.provider';
import { PaginationQueryDto } from '@/common/pagination/dtos/pagination-query.dto';
import type { ActiveUserData } from '@/common/interfaces/active-user-data.interface';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseCategory } from '../entities/expense-category.entity';
import { CreateExpenseCategoryDto } from '../dtos/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from '../dtos/update-expense-category.dto';

@Injectable()
export class ExpenseCategoriesService {
  constructor(
    @InjectRepository(ExpenseCategory)
    private readonly repo: Repository<ExpenseCategory>,
    private readonly paginationProvider: PaginationProvider,
  ) {}

  async findAll(paginationQuery: PaginationQueryDto) {
    try {
      if (paginationQuery.search) {
        return await this.searchCategories(paginationQuery);
      }

      return await this.paginationProvider.paginateQuery(
        paginationQuery,
        this.repo,
        undefined,
        ['createdBy'],
        { name: 'ASC' },
      );
    } catch (error) {
      handleError(error);
    }
  }

  private async searchCategories(paginationQuery: PaginationQueryDto) {
    const limit = paginationQuery.limit || 10;
    const page = paginationQuery.page || 1;
    const skip = (page - 1) * limit;

    const qb = this.repo
      .createQueryBuilder('ec')
      .leftJoinAndSelect('ec.createdBy', 'createdBy')
      .where('ec.name ILIKE :search OR ec.description ILIKE :search', {
        search: `%${paginationQuery.search}%`,
      })
      .orderBy('ec.name', 'ASC');

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
  }

  async findOne(id: number) {
    try {
      const category = await this.repo.findOne({ where: { id }, relations: ['createdBy'] });

      if (!category) {
        throw new NotFoundException(`Expense category #${id} not found`);
      }

      return category;
    } catch (error) {
      handleError(error);
    }
  }

  async create(dto: CreateExpenseCategoryDto, activeUser: ActiveUserData) {
    try {
      const category = this.repo.create({
        name: dto.name,
        description: dto.description ?? null,
        createdBy: { id: activeUser.id } as any,
      });

      return await this.repo.save(category);
    } catch (error) {
      handleError(error);
    }
  }

  async update(id: number, dto: UpdateExpenseCategoryDto) {
    try {
      const category = await this.repo.findOne({ where: { id } });

      if (!category) {
        throw new NotFoundException(`Expense category #${id} not found`);
      }

      Object.assign(category, dto);

      return await this.repo.save(category);
    } catch (error) {
      handleError(error);
    }
  }

  async remove(id: number) {
    try {
      const category = await this.repo.findOne({ where: { id } });

      if (!category) {
        throw new NotFoundException(`Expense category #${id} not found`);
      }

      await this.repo.softDelete(id);

      return { message: 'Expense category deleted successfully' };
    } catch (error) {
      handleError(error);
    }
  }

  async exportCsv() {
    try {
      const categories = await this.repo.find({ order: { name: 'ASC' } });

      const headers = ['ID', 'Name', 'Description', 'Created At', 'Updated At'];
      const rows = categories.map((c) => [
        c.id,
        `"${c.name.replace(/"/g, '""')}"`,
        c.description ? `"${c.description.replace(/"/g, '""')}"` : '',
        c.created_at.toISOString(),
        c.updated_at.toISOString(),
      ]);

      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } catch (error) {
      handleError(error);
    }
  }
}
