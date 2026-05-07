import { handleError } from '@/common/error-handlers/error.handler';
import type { ActiveUserData } from '@/common/interfaces/active-user-data.interface';
import { PaginationQueryDto } from '@/common/pagination/dtos/pagination-query.dto';
import { Item } from '@/items/entities/item.entity';
import { ItemType } from '@/items/enums/item-type.enum';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateRecipeDto } from '../dtos/create-recipe.dto';
import { UpdateRecipeDto } from '../dtos/update-recipe.dto';
import { RecipeItem } from '../entities/recipe-item.entity';
import { Recipe } from '../entities/recipe.entity';

@Injectable()
export class RecipesService {
  constructor(
    @InjectRepository(Recipe)
    private readonly recipesRepository: Repository<Recipe>,
    @InjectRepository(RecipeItem)
    private readonly recipeItemsRepository: Repository<RecipeItem>,
    @InjectRepository(Item)
    private readonly itemsRepository: Repository<Item>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(paginationQuery: PaginationQueryDto) {
    try {
      const limit = paginationQuery.limit || 10;
      const page = paginationQuery.page || 1;
      const skip = (page - 1) * limit;

      const qb = this.recipesRepository
        .createQueryBuilder('recipe')
        .leftJoinAndSelect('recipe.finalProduct', 'finalProduct')
        .leftJoinAndSelect('recipe.recipeItems', 'recipeItems')
        .leftJoinAndSelect('recipeItems.item', 'item')
        .orderBy('recipe.name', 'ASC');

      if (paginationQuery.search) {
        qb.andWhere('recipe.name ILIKE :search', {
          search: `%${paginationQuery.search}%`,
        });
      }

      const [recipes, totalItems] = await qb.skip(skip).take(limit).getManyAndCount();

      const data = recipes.map((recipe) => ({
        id: recipe.id,
        name: recipe.name,
        finalProduct: recipe.finalProduct,
        additionalExpense: Number(recipe.additionalExpense),
        ingredientsCount: recipe.recipeItems.length,
        totalCost: this.computeTotalCost(recipe),
        created_at: recipe.created_at,
        updated_at: recipe.updated_at,
      }));

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
      const recipe = await this.recipesRepository.findOne({
        where: { id },
        relations: {
          finalProduct: true,
          recipeItems: { item: true },
          createdBy: true,
        },
      });

      if (!recipe) {
        throw new NotFoundException(`Recipe #${id} not found`);
      }

      return {
        ...recipe,
        additionalExpense: Number(recipe.additionalExpense),
        totalCost: this.computeTotalCost(recipe),
      };
    } catch (error) {
      handleError(error);
    }
  }

  async create(dto: CreateRecipeDto, activeUser: ActiveUserData) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const finalProduct = await queryRunner.manager.findOne(Item, {
        where: { id: dto.finalProductId },
      });

      if (!finalProduct) {
        throw new NotFoundException(`Item #${dto.finalProductId} not found`);
      }

      if (finalProduct.type !== ItemType.FINAL_PRODUCT) {
        throw new BadRequestException('finalProductId must reference a FINAL_PRODUCT item');
      }

      const existing = await queryRunner.manager.findOne(Recipe, {
        where: { finalProductId: dto.finalProductId },
      });

      if (existing) {
        throw new BadRequestException(
          `A recipe already exists for product "${finalProduct.name}"`,
        );
      }

      const recipe = queryRunner.manager.create(Recipe, {
        name: dto.name,
        finalProductId: dto.finalProductId,
        additionalExpense: dto.additionalExpense ?? 0,
        createdBy: { id: activeUser.id } as any,
      });

      const savedRecipe = await queryRunner.manager.save(Recipe, recipe);

      const recipeItems = dto.items.map((i) =>
        queryRunner.manager.create(RecipeItem, {
          recipeId: savedRecipe.id,
          itemId: i.itemId,
          quantity: i.quantity,
        }),
      );

      await queryRunner.manager.save(RecipeItem, recipeItems);

      await queryRunner.commitTransaction();

      return await this.findOne(savedRecipe.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, dto: UpdateRecipeDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const recipe = await queryRunner.manager.findOne(Recipe, { where: { id } });

      if (!recipe) {
        throw new NotFoundException(`Recipe #${id} not found`);
      }

      if (dto.finalProductId && dto.finalProductId !== recipe.finalProductId) {
        const finalProduct = await queryRunner.manager.findOne(Item, {
          where: { id: dto.finalProductId },
        });

        if (!finalProduct) {
          throw new NotFoundException(`Item #${dto.finalProductId} not found`);
        }

        if (finalProduct.type !== ItemType.FINAL_PRODUCT) {
          throw new BadRequestException('finalProductId must reference a FINAL_PRODUCT item');
        }

        const existing = await queryRunner.manager.findOne(Recipe, {
          where: { finalProductId: dto.finalProductId },
        });

        if (existing) {
          throw new BadRequestException(
            `A recipe already exists for product "${finalProduct.name}"`,
          );
        }
      }

      if (dto.name !== undefined) recipe.name = dto.name;
      if (dto.finalProductId !== undefined) recipe.finalProductId = dto.finalProductId;
      if (dto.additionalExpense !== undefined) recipe.additionalExpense = dto.additionalExpense;

      await queryRunner.manager.save(Recipe, recipe);

      if (dto.items !== undefined) {
        await queryRunner.manager.delete(RecipeItem, { recipeId: id });

        const recipeItems = dto.items.map((i) =>
          queryRunner.manager.create(RecipeItem, {
            recipeId: id,
            itemId: i.itemId,
            quantity: i.quantity,
          }),
        );

        await queryRunner.manager.save(RecipeItem, recipeItems);
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
    try {
      const recipe = await this.recipesRepository.findOne({ where: { id } });

      if (!recipe) {
        throw new NotFoundException(`Recipe #${id} not found`);
      }

      const hasProduction = await this.dataSource.query(
        `SELECT EXISTS(SELECT 1 FROM production_batch WHERE "recipeId" = $1 AND "deletedAt" IS NULL) AS "exists"`,
        [id],
      );

      if (hasProduction[0]?.exists) {
        throw new BadRequestException('Cannot delete recipe with existing production batches');
      }

      await this.recipesRepository.softDelete(id);

      return { message: 'Recipe deleted successfully' };
    } catch (error) {
      handleError(error);
    }
  }

  async exportCsv() {
    try {
      const recipes = await this.recipesRepository.find({
        relations: {
          finalProduct: true,
          recipeItems: { item: true },
        },
        order: { name: 'ASC' },
      });

      const headers = [
        'ID',
        'Name',
        'Final Product',
        'Ingredients Count',
        'Additional Expense',
        'Total Cost',
        'Created At',
      ];

      const rows = recipes.map((recipe) => [
        recipe.id,
        `"${recipe.name.replace(/"/g, '""')}"`,
        recipe.finalProduct ? `"${recipe.finalProduct.name.replace(/"/g, '""')}"` : '',
        recipe.recipeItems.length,
        Number(recipe.additionalExpense),
        this.computeTotalCost(recipe),
        recipe.created_at.toISOString(),
      ]);

      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } catch (error) {
      handleError(error);
    }
  }

  private computeTotalCost(recipe: Recipe): number {
    const materialCost = recipe.recipeItems.reduce((sum, ri) => {
      return sum + ri.quantity * Number(ri.item.averagePrice);
    }, 0);

    return materialCost + Number(recipe.additionalExpense);
  }
}
