import { Account } from '@/accounts/entities/account.entity';
import { Recipe } from '@/recipes/entities/recipe.entity';
import { handleError } from '@/common/error-handlers/error.handler';
import { applySearch } from '@/common/helpers/search-clause.helper';
import type { ActiveUserData } from '@/common/interfaces/active-user-data.interface';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UpdateProductionDto } from '../dtos/update-production.dto';
import { CreateProductionDto } from '../dtos/create-production.dto';
import { ProductionQueryDto } from '../dtos/production-query.dto';
import { ProductionBatch } from '../entities/production-batch.entity';
import { ProductionUnit } from '../entities/production-unit.entity';
import { ProductionUnitItem } from '../entities/production-unit-item.entity';
import { ProductionStatus } from '../enums/production-status.enum';
import { CompleteProductionProvider } from './complete-production.provider';
import { CreateProductionProvider } from './create-production.provider';
import { ProductionSerialProvider } from './production-serial.provider';
import { RefreshPricesProvider } from './refresh-prices.provider';

@Injectable()
export class ProductionService {
  constructor(
    @InjectRepository(ProductionBatch)
    private readonly batchRepository: Repository<ProductionBatch>,
    private readonly dataSource: DataSource,
    private readonly createProvider: CreateProductionProvider,
    private readonly completeProvider: CompleteProductionProvider,
    private readonly serialProvider: ProductionSerialProvider,
    private readonly refreshPricesProvider: RefreshPricesProvider,
  ) {}

  async findAll(query: ProductionQueryDto) {
    try {
      const limit = query.limit || 10;
      const page = query.page || 1;
      const skip = (page - 1) * limit;

      const qb = this.batchRepository
        .createQueryBuilder('batch')
        .leftJoinAndSelect('batch.recipe', 'recipe')
        .leftJoinAndSelect('recipe.finalProduct', 'finalProduct')
        .leftJoinAndSelect('batch.createdBy', 'createdBy')
        .orderBy('batch.created_at', 'DESC');

      applySearch(qb, query.search, {
        text: ['batch.batchNumber', 'recipe.name', 'finalProduct.name'],
        numeric: ['batch.totalCost'],
      });

      if (query.status) {
        qb.andWhere('batch.status::text = :status', { status: query.status });
      }

      if (query.fromDate) {
        qb.andWhere('batch.productionDate >= :fromDate', { fromDate: query.fromDate });
      }

      if (query.toDate) {
        qb.andWhere('batch.productionDate <= :toDate', { toDate: query.toDate });
      }

      const [batches, totalItems] = await qb.skip(skip).take(limit).getManyAndCount();

      return {
        data: batches.map((b) => this.formatBatchSummary(b)),
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
      const batch = await this.batchRepository.findOne({
        where: { id },
        relations: {
          recipe: { finalProduct: true, recipeItems: { item: true } },
          copperAccount: true,
          createdBy: true,
          units: { items: { item: true } },
        },
      });

      if (!batch) {
        throw new NotFoundException(`Production batch #${id} not found`);
      }

      return {
        ...batch,
        totalCost: Number(batch.totalCost),
        copperAmount: Number(batch.copperAmount),
        units: batch.units.map((u) => ({
          ...u,
          unitCost: Number(u.unitCost),
          items: u.items.map((i) => ({
            ...i,
            unitPrice: Number(i.unitPrice),
          })),
        })),
      };
    } catch (error) {
      handleError(error);
    }
  }

  async create(dto: CreateProductionDto, activeUser: ActiveUserData) {
    try {
      const saved = await this.createProvider.create(dto, activeUser);
      return await this.findOne(saved.id);
    } catch (error) {
      handleError(error);
    }
  }

  async complete(id: number) {
    try {
      return await this.completeProvider.complete(id);
    } catch (error) {
      handleError(error);
    }
  }

  async refreshPrices(id: number) {
    try {
      const result = await this.refreshPricesProvider.refresh(id);
      const batch = await this.findOne(id);
      return { ...result, batch };
    } catch (error) {
      handleError(error);
    }
  }

  async cancel(id: number) {
    try {
      const batch = await this.batchRepository.findOne({ where: { id } });

      if (!batch) {
        throw new NotFoundException(`Production batch #${id} not found`);
      }

      if (batch.status !== ProductionStatus.PENDING) {
        throw new BadRequestException(
          `Only PENDING batches can be cancelled. Current: ${batch.status}`,
        );
      }

      batch.status = ProductionStatus.CANCELLED;
      await this.batchRepository.save(batch);

      return { message: 'Batch cancelled successfully' };
    } catch (error) {
      handleError(error);
    }
  }

  async update(id: number, dto: UpdateProductionDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const batch = await queryRunner.manager.findOne(ProductionBatch, {
        where: { id },
        relations: { units: { items: true } },
      });

      if (!batch) {
        throw new NotFoundException(`Production batch #${id} not found`);
      }

      if (batch.status === ProductionStatus.COMPLETED) {
        throw new BadRequestException('Completed batches cannot be edited');
      }

      await this.reverseCopperDeduction(batch, queryRunner);

      const copperAmount = dto.copperAmount ?? Number(batch.copperAmount);
      const copperAccountId = dto.copperAccountId !== undefined
        ? dto.copperAccountId
        : batch.copperAccountId;

      if (copperAmount > 0) {
        if (!copperAccountId) {
          throw new BadRequestException('copperAccountId is required when copperAmount > 0');
        }
        const account = await queryRunner.manager.findOne(Account, {
          where: { id: copperAccountId },
        });
        if (!account) {
          throw new NotFoundException(`Account #${copperAccountId} not found`);
        }
      }

      if (dto.batchNumber !== undefined && dto.batchNumber !== batch.batchNumber) {
        const existing = await queryRunner.manager.findOne(ProductionBatch, {
          where: { batchNumber: dto.batchNumber },
        });
        if (existing && existing.id !== id) {
          throw new BadRequestException(
            `Batch number "${dto.batchNumber}" is already in use`,
          );
        }
        batch.batchNumber = dto.batchNumber;
      }

      if (dto.quantity !== undefined && dto.quantity !== batch.quantity) {
        if (dto.units && dto.units.length !== dto.quantity) {
          throw new BadRequestException(
            `Quantity (${dto.quantity}) must match units count (${dto.units.length})`,
          );
        }
        batch.quantity = dto.quantity;
      }

      if (dto.copperAmount !== undefined) batch.copperAmount = dto.copperAmount;
      if (dto.copperAccountId !== undefined) batch.copperAccountId = dto.copperAccountId;
      if (dto.notes !== undefined) batch.notes = dto.notes;
      if (dto.productionDate !== undefined) batch.productionDate = dto.productionDate;

      if (dto.units !== undefined) {
        // Delete existing unit items then units using raw queries for reliable cascade
        const unitIds = batch.units.map((u) => u.id);
        if (unitIds.length > 0) {
          await queryRunner.query(
            `DELETE FROM production_unit_item WHERE "productionUnitId" IN (${unitIds.join(',')})`,
          );
          await queryRunner.query(
            `DELETE FROM production_unit WHERE "batchId" = $1`,
            [id],
          );
        }
        // Clear the loaded relation to prevent cascade re-save of deleted entities
        batch.units = [];

        const recipe = await queryRunner.manager.findOne(Recipe, { where: { id: batch.recipeId } });
        const recipeExpense = Number(recipe?.additionalExpense) || 0;
        const copperPerUnit = batch.quantity > 0
          ? Number(batch.copperAmount) / batch.quantity
          : 0;

        let batchTotalCost = 0;

        for (const unitDto of dto.units) {
          const unitItemsCost = unitDto.items.reduce(
            (sum, i) => sum + i.quantity * i.unitPrice,
            0,
          );
          const unitCost = unitItemsCost + copperPerUnit + recipeExpense;

          const unit = queryRunner.manager.create(ProductionUnit, {
            batchId: id,
            serialNumber: unitDto.serialNumber,
            unitCost,
          });

          const savedUnit = await queryRunner.manager.save(ProductionUnit, unit);

          const unitItems = unitDto.items.map((i) =>
            queryRunner.manager.create(ProductionUnitItem, {
              productionUnitId: savedUnit.id,
              itemId: i.itemId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
            }),
          );

          await queryRunner.manager.save(ProductionUnitItem, unitItems);

          batchTotalCost += unitCost;
        }

        batch.totalCost = batchTotalCost;
      }

      await queryRunner.manager.update(ProductionBatch, id, {
        batchNumber: batch.batchNumber,
        quantity: batch.quantity,
        copperAmount: batch.copperAmount,
        copperAccountId: batch.copperAccountId,
        notes: batch.notes,
        productionDate: batch.productionDate,
        totalCost: batch.totalCost,
      });

      if (Number(batch.copperAmount) > 0 && batch.copperAccountId) {
        await queryRunner.manager.decrement(
          Account,
          { id: batch.copperAccountId },
          'currentBalance',
          Number(batch.copperAmount),
        );
      }

      await queryRunner.commitTransaction();

      return await this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const batch = await queryRunner.manager.findOne(ProductionBatch, {
        where: { id },
        relations: { units: true },
      });

      if (!batch) {
        throw new NotFoundException(`Production batch #${id} not found`);
      }

      if (batch.status === ProductionStatus.COMPLETED) {
        throw new BadRequestException('Completed batches cannot be deleted');
      }

      if (batch.status === ProductionStatus.PENDING) {
        await this.reverseCopperDeduction(batch, queryRunner);
      }

      // Hard-delete units and their items to release serial numbers
      const unitIds = batch.units.map((u) => u.id);
      if (unitIds.length > 0) {
        await queryRunner.query(
          `DELETE FROM production_unit_item WHERE "productionUnitId" IN (${unitIds.join(',')})`,
        );
        await queryRunner.query(
          `DELETE FROM production_unit WHERE "batchId" = $1`,
          [id],
        );
      }

      await queryRunner.manager.softDelete(ProductionBatch, id);

      await queryRunner.commitTransaction();

      return { message: 'Production batch deleted successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
    } finally {
      await queryRunner.release();
    }
  }

  async getSummary() {
    try {
      const qb = this.batchRepository.createQueryBuilder('batch');

      const totalBatches = await qb.getCount();

      const result = await this.batchRepository
        .createQueryBuilder('batch')
        .select('SUM(batch.totalCost)', 'totalCost')
        .addSelect('COUNT(batch.id)', 'totalBatches')
        .addSelect(
          `COUNT(CASE WHEN batch.status = 'completed' THEN 1 END)`,
          'completedBatches',
        )
        .addSelect(
          `COUNT(CASE WHEN batch.status = 'pending' THEN 1 END)`,
          'pendingBatches',
        )
        .getRawOne();

      return {
        totalBatches,
        completedBatches: Number(result.completedBatches) || 0,
        pendingBatches: Number(result.pendingBatches) || 0,
        totalProductionCost: Number(result.totalCost) || 0,
      };
    } catch (error) {
      handleError(error);
    }
  }

  async generateSerialNumbers(quantity: number, activeUser: ActiveUserData) {
    try {
      const serials = await this.serialProvider.generateSerialNumbers(quantity, activeUser);
      return { serials };
    } catch (error) {
      handleError(error);
    }
  }

  async exportCsv() {
    try {
      const batches = await this.batchRepository.find({
        relations: { recipe: { finalProduct: true }, createdBy: true },
        order: { created_at: 'DESC' },
      });

      const headers = [
        'ID',
        'Batch Number',
        'Recipe',
        'Final Product',
        'Quantity',
        'Production Date',
        'Status',
        'Copper Amount',
        'Total Cost',
        'Created At',
      ];

      const rows = batches.map((b) => [
        b.id,
        `"${b.batchNumber}"`,
        b.recipe ? `"${b.recipe.name.replace(/"/g, '""')}"` : '',
        b.recipe?.finalProduct ? `"${b.recipe.finalProduct.name.replace(/"/g, '""')}"` : '',
        b.quantity,
        b.productionDate ?? '',
        b.status,
        Number(b.copperAmount),
        Number(b.totalCost),
        b.created_at.toISOString(),
      ]);

      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } catch (error) {
      handleError(error);
    }
  }

  private formatBatchSummary(batch: ProductionBatch) {
    return {
      id: batch.id,
      batchNumber: batch.batchNumber,
      recipe: batch.recipe,
      quantity: batch.quantity,
      productionDate: batch.productionDate,
      status: batch.status,
      copperAmount: Number(batch.copperAmount),
      totalCost: Number(batch.totalCost),
      notes: batch.notes,
      createdBy: batch.createdBy,
      created_at: batch.created_at,
      updated_at: batch.updated_at,
    };
  }

  private async reverseCopperDeduction(
    batch: ProductionBatch,
    queryRunner: ReturnType<DataSource['createQueryRunner']>,
  ): Promise<void> {
    const copperAmount = Number(batch.copperAmount);
    if (copperAmount > 0 && batch.copperAccountId) {
      await queryRunner.manager.increment(
        Account,
        { id: batch.copperAccountId },
        'currentBalance',
        copperAmount,
      );
    }
  }
}
