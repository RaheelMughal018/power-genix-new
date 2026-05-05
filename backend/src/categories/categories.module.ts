import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Item } from '@/items/entities/item.entity';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './providers/categories.service';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Item])],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
