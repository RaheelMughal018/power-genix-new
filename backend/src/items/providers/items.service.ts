import { toCsvBuffer } from '@/common/helpers/csv.helper';
import { handleError } from '@/common/error-handlers/error.handler';
import type { ActiveUserData } from '@/common/interfaces/active-user-data.interface';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from '../entities/item.entity';
import { CreateItemDto } from '../dtos/create-item.dto';
import { UpdateItemDto } from '../dtos/update-item.dto';
import { ItemQueryDto } from '../dtos/item-query.dto';
import { ItemType } from '../enums/item-type.enum';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private readonly itemsRepository: Repository<Item>,
  ) {}

  async findAll(query: ItemQueryDto) {
    try {
      const limit = query.limit || 10;
      const page = query.page || 1;
      const skip = (page - 1) * limit;

      const qb = this.itemsRepository
        .createQueryBuilder('item')
        .leftJoinAndSelect('item.category', 'category')
        .leftJoinAndSelect('item.createdBy', 'createdBy')
        .orderBy('item.name', 'ASC');

      if (query.search) {
        qb.andWhere('item.name ILIKE :search', { search: `%${query.search}%` });
      }

      if (query.type) {
        qb.andWhere('item.type = :type', { type: query.type });
      }

      if (query.categoryId) {
        qb.andWhere('item.categoryId = :categoryId', { categoryId: query.categoryId });
      }

      if (query.stockStatus === 'in_stock') {
        qb.andWhere('item.totalQuantity > 0');
      } else if (query.stockStatus === 'out_of_stock') {
        qb.andWhere('item.totalQuantity = 0');
      }

      const [data, totalItems] = await qb.skip(skip).take(limit).getManyAndCount();

      const enriched = data.map((item) => ({
        ...item,
        totalAmount: Number(item.averagePrice) * item.totalQuantity,
      }));

      return {
        data: enriched,
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
      const item = await this.itemsRepository.findOne({
        where: { id },
        relations: ['category', 'createdBy'],
      });

      if (!item) {
        throw new NotFoundException(`Item #${id} not found`);
      }

      return {
        ...item,
        totalAmount: Number(item.averagePrice) * item.totalQuantity,
      };
    } catch (error) {
      handleError(error);
    }
  }

  async getSummary() {
    try {
      const result = await this.itemsRepository
        .createQueryBuilder('item')
        .where('item.deletedAt IS NULL')
        .select('COUNT(item.id)', 'totalItems')
        .addSelect('COALESCE(SUM(item."totalQuantity"), 0)', 'totalUnits')
        .addSelect(
          'COALESCE(SUM(CAST(item."averagePrice" AS numeric) * item."totalQuantity"), 0)',
          'totalStockValue',
        )
        .getRawOne<{ totalItems: string; totalUnits: string; totalStockValue: string }>();

      return {
        totalItems: Number(result?.totalItems ?? 0),
        totalUnits: Number(result?.totalUnits ?? 0),
        totalStockValue: Number(result?.totalStockValue ?? 0),
      };
    } catch (error) {
      handleError(error);
    }
  }

  async getLowStockItems() {
    try {
      const items = await this.itemsRepository
        .createQueryBuilder('item')
        .leftJoinAndSelect('item.category', 'category')
        .leftJoinAndSelect('item.createdBy', 'createdBy')
        .where('item.type = :type', { type: ItemType.RAW_MATERIAL })
        .andWhere('item.totalQuantity < item.minStock')
        .orderBy('item.name', 'ASC')
        .getMany();

      return items.map((item) => ({
        ...item,
        totalAmount: Number(item.averagePrice) * item.totalQuantity,
      }));
    } catch (error) {
      handleError(error);
    }
  }

  async create(dto: CreateItemDto, activeUser: ActiveUserData) {
    try {
      const item = this.itemsRepository.create({
        name: dto.name,
        categoryId: dto.categoryId,
        type: dto.type,
        unit: dto.unit,
        createdBy: { id: activeUser.id } as any,
      });

      return await this.itemsRepository.save(item);
    } catch (error) {
      handleError(error);
    }
  }

  async update(id: number, dto: UpdateItemDto) {
    try {
      const item = await this.itemsRepository.findOne({ where: { id } });

      if (!item) {
        throw new NotFoundException(`Item #${id} not found`);
      }

      Object.assign(item, dto);

      return await this.itemsRepository.save(item);
    } catch (error) {
      handleError(error);
    }
  }

  async remove(id: number) {
    try {
      const item = await this.itemsRepository.findOne({ where: { id } });

      if (!item) {
        throw new NotFoundException(`Item #${id} not found`);
      }

      if (item.totalQuantity > 0) {
        throw new BadRequestException(
          'Cannot delete item with existing stock. Clear stock first.',
        );
      }

      // TODO: Also check for invoice/recipe records before deleting

      await this.itemsRepository.softDelete(id);

      return { message: 'Item deleted successfully' };
    } catch (error) {
      handleError(error);
    }
  }

  async findAllForPdf() {
    return this.itemsRepository.find({
      relations: ['category'],
      order: { name: 'ASC' },
    });
  }

  async exportCsv() {
    try {
      const items = await this.itemsRepository.find({
        relations: ['category'],
        order: { name: 'ASC' },
      });

      return toCsvBuffer(
        ['Name', 'Category', 'Current Stock', 'Min Stock', 'Cost Price', 'Sale Price', 'Type'],
        items.map((item) => ({
          'Name': item.name,
          'Category': item.category?.name ?? '',
          'Current Stock': item.totalQuantity,
          'Min Stock': item.minStock,
          'Cost Price': item.averagePrice,
          'Sale Price': item.averagePrice,
          'Type': item.type,
        })),
      );
    } catch (error) {
      handleError(error);
    }
  }
}
