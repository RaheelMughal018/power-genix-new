import { toCsvBuffer } from '@/common/helpers/csv.helper';
import { handleError } from '@/common/error-handlers/error.handler';
import { PaginationProvider } from '@/common/pagination/providers/pagination.provider';
import { PaginationQueryDto } from '@/common/pagination/dtos/pagination-query.dto';
import type { ActiveUserData } from '@/common/interfaces/active-user-data.interface';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { Item } from '@/items/entities/item.entity';
import { CreateCategoryDto } from '../dtos/create-category.dto';
import { UpdateCategoryDto } from '../dtos/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(Item)
    private readonly itemsRepository: Repository<Item>,
    private readonly paginationProvider: PaginationProvider,
  ) {}

  async findAll(paginationQuery: PaginationQueryDto) {
    try {
      if (paginationQuery.search) {
        return await this.searchCategories(paginationQuery);
      }

      return await this.paginationProvider.paginateQuery(
        paginationQuery,
        this.categoriesRepository,
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

    const qb = this.categoriesRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.createdBy', 'createdBy')
      .where('category.name ILIKE :search', {
        search: `%${paginationQuery.search}%`,
      })
      .orderBy('category.name', 'ASC');

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
      const category = await this.categoriesRepository.findOne({ where: { id } });

      if (!category) {
        throw new NotFoundException(`Category #${id} not found`);
      }

      return category;
    } catch (error) {
      handleError(error);
    }
  }

  async create(dto: CreateCategoryDto, activeUser: ActiveUserData) {
    try {
      const category = this.categoriesRepository.create({
        name: dto.name,
        createdBy: { id: activeUser.id } as any,
      });

      return await this.categoriesRepository.save(category);
    } catch (error) {
      handleError(error);
    }
  }

  async update(id: number, dto: UpdateCategoryDto) {
    try {
      const category = await this.categoriesRepository.findOne({ where: { id } });

      if (!category) {
        throw new NotFoundException(`Category #${id} not found`);
      }

      Object.assign(category, dto);

      return await this.categoriesRepository.save(category);
    } catch (error) {
      handleError(error);
    }
  }

  async remove(id: number) {
    try {
      const category = await this.categoriesRepository.findOne({ where: { id } });

      if (!category) {
        throw new NotFoundException(`Category #${id} not found`);
      }

      const itemCount = await this.itemsRepository.count({ where: { categoryId: id } });
      if (itemCount > 0) {
        throw new BadRequestException('Cannot delete category with assigned items');
      }

      await this.categoriesRepository.softDelete(id);

      return { message: 'Category deleted successfully' };
    } catch (error) {
      handleError(error);
    }
  }

  async exportCsv() {
    try {
      const categories = await this.categoriesRepository.find({
        order: { name: 'ASC' },
      });

      return toCsvBuffer(
        ['ID', 'Name', 'Created At', 'Updated At'],
        categories.map((c) => ({
          'ID': c.id,
          'Name': c.name,
          'Created At': c.created_at.toISOString(),
          'Updated At': c.updated_at.toISOString(),
        })),
      );
    } catch (error) {
      handleError(error);
    }
  }
}
