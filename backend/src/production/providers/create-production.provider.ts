import { Account } from '@/accounts/entities/account.entity';
import { handleError } from '@/common/error-handlers/error.handler';
import type { ActiveUserData } from '@/common/interfaces/active-user-data.interface';
import { Item } from '@/items/entities/item.entity';
import { Recipe } from '@/recipes/entities/recipe.entity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateProductionDto } from '../dtos/create-production.dto';
import { ProductionBatch } from '../entities/production-batch.entity';
import { ProductionUnit } from '../entities/production-unit.entity';
import { ProductionUnitItem } from '../entities/production-unit-item.entity';
import { ProductionStatus } from '../enums/production-status.enum';

@Injectable()
export class CreateProductionProvider {
  constructor(
    @InjectRepository(ProductionBatch)
    private readonly batchRepository: Repository<ProductionBatch>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateProductionDto, activeUser: ActiveUserData): Promise<ProductionBatch> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const recipe = await queryRunner.manager.findOne(Recipe, {
        where: { id: dto.recipeId },
      });

      if (!recipe) {
        throw new NotFoundException(`Recipe #${dto.recipeId} not found`);
      }

      if (dto.copperAmount && dto.copperAmount > 0) {
        if (!dto.copperAccountId) {
          throw new BadRequestException('copperAccountId is required when copperAmount > 0');
        }
        const account = await queryRunner.manager.findOne(Account, {
          where: { id: dto.copperAccountId },
        });
        if (!account) {
          throw new NotFoundException(`Account #${dto.copperAccountId} not found`);
        }
      }

      await this.validateUniqueSerials(dto.units.map((u) => u.serialNumber), queryRunner);

      const batchNumber = await this.generateBatchNumber(queryRunner);

      const copperAmount = dto.copperAmount ?? 0;
      const copperPerUnit = dto.quantity > 0 ? copperAmount / dto.quantity : 0;
      const recipeExpense = Number(recipe.additionalExpense) || 0;

      const batch = queryRunner.manager.create(ProductionBatch, {
        batchNumber,
        recipeId: dto.recipeId,
        quantity: dto.quantity,
        productionDate: dto.productionDate,
        status: ProductionStatus.PENDING,
        copperAmount,
        copperAccountId: dto.copperAccountId ?? null,
        notes: dto.notes ?? null,
        totalCost: 0,
        createdById: activeUser.id,
      });

      const savedBatch = await queryRunner.manager.save(ProductionBatch, batch);

      let batchTotalCost = 0;

      for (const unitDto of dto.units) {
        const unitItemsCost = unitDto.items.reduce(
          (sum, i) => sum + i.quantity * i.unitPrice,
          0,
        );
        const unitCost = unitItemsCost + copperPerUnit + recipeExpense;

        const unit = queryRunner.manager.create(ProductionUnit, {
          batchId: savedBatch.id,
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

      savedBatch.totalCost = batchTotalCost;
      await queryRunner.manager.save(ProductionBatch, savedBatch);

      if (copperAmount > 0 && dto.copperAccountId) {
        await queryRunner.manager.decrement(
          Account,
          { id: dto.copperAccountId },
          'currentBalance',
          copperAmount,
        );
      }

      await queryRunner.commitTransaction();

      return savedBatch;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async validateUniqueSerials(
    serials: string[],
    queryRunner: ReturnType<DataSource['createQueryRunner']>,
  ): Promise<void> {
    const uniqueSerials = new Set(serials);
    if (uniqueSerials.size !== serials.length) {
      throw new BadRequestException('Duplicate serial numbers in request');
    }

    const existing = await queryRunner.manager
      .createQueryBuilder(ProductionUnit, 'unit')
      .where('unit.serialNumber IN (:...serials)', { serials })
      .getOne();

    if (existing) {
      throw new BadRequestException(
        `Serial number "${existing.serialNumber}" already exists`,
      );
    }
  }

  private async generateBatchNumber(
    queryRunner: ReturnType<DataSource['createQueryRunner']>,
  ): Promise<string> {
    const last = await queryRunner.manager
      .createQueryBuilder(ProductionBatch, 'batch')
      .withDeleted()
      .orderBy('batch.id', 'DESC')
      .getOne();

    if (!last) {
      return 'BATCH-0001';
    }

    const parts = last.batchNumber.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    const next = isNaN(lastNum) ? 1 : lastNum + 1;
    return `BATCH-${String(next).padStart(4, '0')}`;
  }
}
