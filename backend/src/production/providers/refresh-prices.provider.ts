import { handleError } from '@/common/error-handlers/error.handler';
import { Recipe } from '@/recipes/entities/recipe.entity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ProductionBatch } from '../entities/production-batch.entity';
import { ProductionUnit } from '../entities/production-unit.entity';
import { ProductionUnitItem } from '../entities/production-unit-item.entity';
import { ProductionStatus } from '../enums/production-status.enum';

@Injectable()
export class RefreshPricesProvider {
  constructor(private readonly dataSource: DataSource) {}

  async refresh(id: number): Promise<{ message: string; updatedItems: number }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const batch = await queryRunner.manager.findOne(ProductionBatch, {
        where: { id },
        relations: { units: { items: { item: true } } },
      });

      if (!batch) {
        throw new NotFoundException(`Production batch #${id} not found`);
      }

      if (batch.status !== ProductionStatus.PENDING) {
        throw new BadRequestException(
          `Prices can only be refreshed for PENDING batches. Current: ${batch.status}`,
        );
      }

      const recipe = await queryRunner.manager.findOne(Recipe, {
        where: { id: batch.recipeId },
      });
      const recipeExpense = Number(recipe?.additionalExpense) || 0;
      const copperPerUnit =
        batch.quantity > 0 ? Number(batch.copperAmount) / batch.quantity : 0;

      let updatedItems = 0;
      let batchTotalCost = 0;

      for (const unit of batch.units) {
        let unitItemsCost = 0;

        for (const ui of unit.items) {
          const currentAvg = Number(ui.item.averagePrice);
          if (Number(ui.unitPrice) !== currentAvg) {
            ui.unitPrice = currentAvg;
            await queryRunner.manager.update(
              ProductionUnitItem,
              { id: ui.id },
              { unitPrice: currentAvg },
            );
            updatedItems += 1;
          }
          unitItemsCost += Number(ui.quantity) * currentAvg;
        }

        const newUnitCost = unitItemsCost + copperPerUnit + recipeExpense;
        if (Number(unit.unitCost) !== newUnitCost) {
          await queryRunner.manager.update(
            ProductionUnit,
            { id: unit.id },
            { unitCost: newUnitCost },
          );
        }
        batchTotalCost += newUnitCost;
      }

      await queryRunner.manager.update(
        ProductionBatch,
        { id },
        { totalCost: batchTotalCost },
      );

      await queryRunner.commitTransaction();

      return {
        message:
          updatedItems > 0
            ? `Refreshed prices for ${updatedItems} item(s)`
            : 'No price changes detected',
        updatedItems,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
