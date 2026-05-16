import { toCsvBuffer } from '@/common/helpers/csv.helper';
import { handleError } from '@/common/error-handlers/error.handler';
import { calculateWeightedAverage } from '@/common/helpers/stock.helper';
import type { ActiveUserData } from '@/common/interfaces/active-user-data.interface';
import { Item } from '@/items/entities/item.entity';
import { Supplier } from '@/suppliers/entities/supplier.entity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { CreateStockAdjustmentDto } from '../dtos/create-stock-adjustment.dto';
import { StockAdjustmentQueryDto } from '../dtos/stock-adjustment-query.dto';
import { UpdateStockAdjustmentDto } from '../dtos/update-stock-adjustment.dto';
import { StockAdjustment } from '../entities/stock-adjustment.entity';
import { AdjustmentReason } from '../enums/adjustment-reason.enum';
import { AdjustmentType } from '../enums/adjustment-type.enum';

@Injectable()
export class StockAdjustmentsService {
  constructor(
    @InjectRepository(StockAdjustment)
    private readonly repo: Repository<StockAdjustment>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: StockAdjustmentQueryDto) {
    try {
      const limit = query.limit || 10;
      const page = query.page || 1;
      const skip = (page - 1) * limit;

      const qb = this.repo
        .createQueryBuilder('adj')
        .leftJoinAndSelect('adj.item', 'item')
        .leftJoinAndSelect('adj.supplier', 'supplier')
        .leftJoinAndSelect('adj.createdBy', 'createdBy')
        .orderBy('adj.date', 'DESC')
        .addOrderBy('adj.id', 'DESC');

      if (query.itemId) {
        qb.andWhere('adj.itemId = :itemId', { itemId: query.itemId });
      }

      if (query.type) {
        qb.andWhere('adj.type = :type', { type: query.type });
      }

      if (query.reason) {
        qb.andWhere('adj.reason = :reason', { reason: query.reason });
      }

      if (query.fromDate) {
        qb.andWhere('adj.date >= :fromDate', { fromDate: query.fromDate });
      }

      if (query.toDate) {
        qb.andWhere('adj.date <= :toDate', { toDate: query.toDate });
      }

      if (query.search) {
        qb.andWhere('item.name ILIKE :search', { search: `%${query.search}%` });
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

  async findByItem(itemId: number) {
    try {
      return await this.repo.find({
        where: { itemId },
        relations: ['item', 'supplier', 'createdBy'],
        order: { date: 'DESC', id: 'DESC' },
      });
    } catch (error) {
      handleError(error);
    }
  }

  async findOne(id: number) {
    try {
      const adjustment = await this.repo.findOne({
        where: { id },
        relations: ['item', 'supplier', 'createdBy'],
      });

      if (!adjustment) {
        throw new NotFoundException(`Stock adjustment #${id} not found`);
      }

      return adjustment;
    } catch (error) {
      handleError(error);
    }
  }

  async getItemStockInfo(itemId: number) {
    try {
      const item = await this.dataSource.getRepository(Item).findOne({
        where: { id: itemId },
        relations: ['category'],
      });

      if (!item) {
        throw new NotFoundException(`Item #${itemId} not found`);
      }

      return {
        id: item.id,
        name: item.name,
        unit: item.unit,
        totalQuantity: Number(item.totalQuantity),
        averagePrice: Number(item.averagePrice),
        totalValue: Number(item.totalQuantity) * Number(item.averagePrice),
      };
    } catch (error) {
      handleError(error);
    }
  }

  async create(dto: CreateStockAdjustmentDto, activeUser: ActiveUserData) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const item = await queryRunner.manager.findOne(Item, { where: { id: dto.itemId } });
      if (!item) throw new NotFoundException(`Item #${dto.itemId} not found`);

      this.validateDto(dto);

      let deductionAmount: number | null = null;

      if (dto.type === AdjustmentType.ADD) {
        await this.applyAdd(queryRunner, item, dto.quantity, dto.unitPrice!);
      } else if (dto.reason === AdjustmentReason.RETURN_TO_SUPPLIER) {
        const supplier = await queryRunner.manager.findOne(Supplier, { where: { id: dto.supplierId! } });
        if (!supplier) throw new NotFoundException(`Supplier #${dto.supplierId} not found`);
        deductionAmount = await this.applyReturnToSupplier(queryRunner, item, dto.quantity, dto.unitPrice!);
      } else {
        await this.applyDamagedLost(queryRunner, item, dto.quantity);
      }

      const adjustment = queryRunner.manager.create(StockAdjustment, {
        itemId: dto.itemId,
        quantity: dto.quantity,
        unitPrice: dto.unitPrice ?? null,
        deductionAmount,
        type: dto.type,
        reason: dto.reason,
        supplierId: dto.supplierId ?? null,
        notes: dto.notes ?? null,
        date: dto.date,
        createdById: activeUser.id,
      });

      const saved = await queryRunner.manager.save(StockAdjustment, adjustment);
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

  async update(id: number, dto: UpdateStockAdjustmentDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const adjustment = await queryRunner.manager.findOne(StockAdjustment, { where: { id } });
      if (!adjustment) throw new NotFoundException(`Stock adjustment #${id} not found`);

      // Reverse old adjustment
      const oldItem = await queryRunner.manager.findOne(Item, { where: { id: adjustment.itemId } });
      if (!oldItem) throw new NotFoundException(`Item #${adjustment.itemId} not found`);

      await this.reverseAdjustment(queryRunner, adjustment, oldItem);

      // Determine final values (merge old + new)
      const finalItemId = dto.itemId ?? adjustment.itemId;
      const finalQty = dto.quantity ?? adjustment.quantity;
      const finalType = dto.type ?? adjustment.type;
      const finalReason = dto.reason ?? adjustment.reason;
      const finalUnitPrice = dto.unitPrice ?? adjustment.unitPrice ?? undefined;
      const finalSupplierId = dto.supplierId ?? adjustment.supplierId ?? undefined;

      const finalItem = finalItemId !== adjustment.itemId
        ? await queryRunner.manager.findOne(Item, { where: { id: finalItemId } })
        : oldItem;

      if (!finalItem) throw new NotFoundException(`Item #${finalItemId} not found`);

      const mergedDto: CreateStockAdjustmentDto = {
        itemId: finalItemId,
        quantity: finalQty,
        unitPrice: finalUnitPrice,
        type: finalType,
        reason: finalReason,
        supplierId: finalSupplierId,
        notes: dto.notes ?? adjustment.notes ?? undefined,
        date: dto.date ?? adjustment.date,
      };

      this.validateDto(mergedDto);

      let deductionAmount: number | null = null;

      if (finalType === AdjustmentType.ADD) {
        await this.applyAdd(queryRunner, finalItem, finalQty, finalUnitPrice!);
      } else if (finalReason === AdjustmentReason.RETURN_TO_SUPPLIER) {
        if (finalSupplierId) {
          const supplier = await queryRunner.manager.findOne(Supplier, { where: { id: finalSupplierId } });
          if (!supplier) throw new NotFoundException(`Supplier #${finalSupplierId} not found`);
        }
        deductionAmount = await this.applyReturnToSupplier(queryRunner, finalItem, finalQty, finalUnitPrice!);
      } else {
        await this.applyDamagedLost(queryRunner, finalItem, finalQty);
      }

      Object.assign(adjustment, {
        itemId: finalItemId,
        quantity: finalQty,
        unitPrice: finalUnitPrice ?? null,
        deductionAmount,
        type: finalType,
        reason: finalReason,
        supplierId: finalSupplierId ?? null,
        notes: dto.notes !== undefined ? dto.notes : adjustment.notes,
        date: dto.date ?? adjustment.date,
      });

      const updated = await queryRunner.manager.save(StockAdjustment, adjustment);
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
      const adjustment = await queryRunner.manager.findOne(StockAdjustment, { where: { id } });
      if (!adjustment) throw new NotFoundException(`Stock adjustment #${id} not found`);

      const item = await queryRunner.manager.findOne(Item, { where: { id: adjustment.itemId } });
      if (!item) throw new NotFoundException(`Item #${adjustment.itemId} not found`);

      await this.reverseAdjustment(queryRunner, adjustment, item);
      await queryRunner.manager.softDelete(StockAdjustment, id);

      await queryRunner.commitTransaction();

      return { message: 'Stock adjustment deleted successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async exportCsv(): Promise<string> {
    try {
      const adjustments = await this.repo.find({
        relations: ['item'],
        order: { date: 'DESC' },
      });

      return toCsvBuffer(
        ['Date', 'Item', 'Type', 'Quantity', 'Reason', 'Notes'],
        adjustments.map((a) => ({
          'Date': a.date,
          'Item': a.item?.name ?? '',
          'Type': a.type,
          'Quantity': a.quantity,
          'Reason': a.reason,
          'Notes': a.notes ?? '',
        })),
      );
    } catch (error) {
      handleError(error);
      throw error;
    }
  }

  private validateDto(dto: CreateStockAdjustmentDto) {
    if (dto.type === AdjustmentType.ADD && !dto.unitPrice) {
      throw new BadRequestException('unitPrice is required when type is add');
    }
    if (dto.reason === AdjustmentReason.RETURN_TO_SUPPLIER && !dto.supplierId) {
      throw new BadRequestException('supplierId is required when reason is return_to_supplier');
    }
    if (dto.reason === AdjustmentReason.RETURN_TO_SUPPLIER && !dto.unitPrice) {
      throw new BadRequestException('unitPrice is required when reason is return_to_supplier');
    }
    if (dto.type === AdjustmentType.ADD && (
      dto.reason === AdjustmentReason.RETURN_TO_SUPPLIER ||
      dto.reason === AdjustmentReason.DAMAGED_LOST
    )) {
      throw new BadRequestException('Reason return_to_supplier and damaged_lost are only valid for deduct type');
    }
    if (dto.type === AdjustmentType.DEDUCT && (
      dto.reason === AdjustmentReason.OPENING_STOCK ||
      dto.reason === AdjustmentReason.MISCOUNT
    )) {
      throw new BadRequestException('Reason opening_stock and miscount are only valid for add type');
    }
  }

  private async applyAdd(
    queryRunner: QueryRunner,
    item: Item,
    qty: number,
    unitPrice: number,
  ) {
    const newAvg = calculateWeightedAverage(
      Number(item.totalQuantity),
      Number(item.averagePrice),
      qty,
      Number(unitPrice),
    );

    await queryRunner.manager.update(Item, { id: item.id }, {
      totalQuantity: Number(item.totalQuantity) + qty,
      averagePrice: newAvg,
    });

    item.totalQuantity = Number(item.totalQuantity) + qty;
    item.averagePrice = newAvg;
  }

  private async applyReturnToSupplier(
    queryRunner: QueryRunner,
    item: Item,
    qty: number,
    unitPrice: number,
  ): Promise<number> {
    const currentQty = Number(item.totalQuantity);
    if (currentQty < qty) {
      throw new BadRequestException(
        `Insufficient stock for "${item.name}": available ${currentQty}, requested ${qty}`,
      );
    }

    const deductionAmount = qty * Number(unitPrice);

    await queryRunner.manager.update(Item, { id: item.id }, {
      totalQuantity: currentQty - qty,
    });

    item.totalQuantity = Number(item.totalQuantity) - qty;

    return deductionAmount;
  }

  private async applyDamagedLost(
    queryRunner: QueryRunner,
    item: Item,
    qty: number,
  ) {
    const currentQty = Number(item.totalQuantity);
    if (currentQty < qty) {
      throw new BadRequestException(
        `Insufficient stock for "${item.name}": available ${currentQty}, requested ${qty}`,
      );
    }

    await queryRunner.manager.update(Item, { id: item.id }, {
      totalQuantity: currentQty - qty,
    });

    item.totalQuantity = currentQty - qty;
  }

  private async reverseAdjustment(
    queryRunner: QueryRunner,
    adjustment: StockAdjustment,
    item: Item,
  ) {
    if (adjustment.type === AdjustmentType.ADD) {
      // Reverse: remove the added qty and recalculate avg going backwards
      const currentQty = Number(item.totalQuantity);
      if (currentQty < adjustment.quantity) {
        throw new BadRequestException(
          `Cannot reverse adjustment for "${item.name}": stock already consumed (available ${currentQty}, need ${adjustment.quantity})`,
        );
      }
      const newQty = currentQty - adjustment.quantity;
      // Back-calculate avg: (total - added portion) / remaining qty
      const oldTotal = Number(item.totalQuantity) * Number(item.averagePrice);
      const addedTotal = adjustment.quantity * Number(adjustment.unitPrice ?? 0);
      const newAvg = newQty > 0 ? (oldTotal - addedTotal) / newQty : 0;

      await queryRunner.manager.update(Item, { id: item.id }, {
        totalQuantity: newQty,
        averagePrice: Math.max(0, newAvg),
      });

      item.totalQuantity = newQty;
      item.averagePrice = Math.max(0, newAvg);
    } else {
      // Reverse deduction: restore qty (avg stays the same for deduct ops)
      await queryRunner.manager.update(Item, { id: item.id }, {
        totalQuantity: Number(item.totalQuantity) + adjustment.quantity,
      });

      item.totalQuantity = Number(item.totalQuantity) + adjustment.quantity;
    }
  }
}
