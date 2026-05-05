import { handleError } from '@/common/error-handlers/error.handler';
import { Item } from '@/items/entities/item.entity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ProductionBatch } from '../entities/production-batch.entity';
import { ProductionStatus } from '../enums/production-status.enum';
import type { CompleteResult, StockShortfall } from '../interfaces/complete-result.interface';

@Injectable()
export class CompleteProductionProvider {
  constructor(private readonly dataSource: DataSource) {}

  async complete(id: number): Promise<CompleteResult> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const batch = await queryRunner.manager.findOne(ProductionBatch, {
        where: { id },
        relations: {
          recipe: { finalProduct: true },
          units: { items: { item: true } },
        },
      });

      if (!batch) {
        throw new NotFoundException(`Production batch #${id} not found`);
      }

      if (batch.status !== ProductionStatus.PENDING) {
        throw new BadRequestException(
          `Batch can only be completed from PENDING status. Current: ${batch.status}`,
        );
      }

      const itemRequirements = this.aggregateItemRequirements(batch);
      const shortfall = await this.checkStockSufficiency(itemRequirements, queryRunner);

      if (shortfall.length > 0) {
        await queryRunner.rollbackTransaction();
        return { success: false, shortfall };
      }

      for (const [itemId, required] of itemRequirements) {
        await queryRunner.manager.decrement(Item, { id: itemId }, 'totalQuantity', required);
      }

      const finalProductId = batch.recipe.finalProduct.id;
      await queryRunner.manager.increment(
        Item,
        { id: finalProductId },
        'totalQuantity',
        batch.quantity,
      );

      batch.status = ProductionStatus.COMPLETED;
      await queryRunner.manager.save(ProductionBatch, batch);

      await queryRunner.commitTransaction();

      return { success: true, message: 'Batch completed successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private aggregateItemRequirements(batch: ProductionBatch): Map<number, number> {
    const requirements = new Map<number, number>();

    for (const unit of batch.units) {
      for (const unitItem of unit.items) {
        const current = requirements.get(unitItem.itemId) ?? 0;
        requirements.set(unitItem.itemId, current + unitItem.quantity);
      }
    }

    return requirements;
  }

  private async checkStockSufficiency(
    requirements: Map<number, number>,
    queryRunner: ReturnType<DataSource['createQueryRunner']>,
  ): Promise<StockShortfall[]> {
    const shortfall: StockShortfall[] = [];

    for (const [itemId, required] of requirements) {
      const item = await queryRunner.manager.findOne(Item, { where: { id: itemId } });

      if (!item || item.totalQuantity < required) {
        shortfall.push({
          itemId,
          itemName: item?.name ?? `Item #${itemId}`,
          required,
          available: item?.totalQuantity ?? 0,
        });
      }
    }

    return shortfall;
  }
}
