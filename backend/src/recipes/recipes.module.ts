import { Item } from '@/items/entities/item.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecipeItem } from './entities/recipe-item.entity';
import { Recipe } from './entities/recipe.entity';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './providers/recipes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Recipe, RecipeItem, Item])],
  controllers: [RecipesController],
  providers: [RecipesService],
  exports: [RecipesService],
})
export class RecipesModule {}
