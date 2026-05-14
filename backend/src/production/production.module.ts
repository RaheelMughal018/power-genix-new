import { Account } from '@/accounts/entities/account.entity';
import { Item } from '@/items/entities/item.entity';
import { RecipeItem } from '@/recipes/entities/recipe-item.entity';
import { Recipe } from '@/recipes/entities/recipe.entity';
import { SettingsModule } from '@/settings/settings.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionBatch } from './entities/production-batch.entity';
import { ProductionUnit } from './entities/production-unit.entity';
import { ProductionUnitItem } from './entities/production-unit-item.entity';
import { ProductionController } from './production.controller';
import { CompleteProductionProvider } from './providers/complete-production.provider';
import { CreateProductionProvider } from './providers/create-production.provider';
import { ProductionSerialProvider } from './providers/production-serial.provider';
import { ProductionService } from './providers/production.service';
import { RefreshPricesProvider } from './providers/refresh-prices.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductionBatch,
      ProductionUnit,
      ProductionUnitItem,
      Recipe,
      RecipeItem,
      Item,
      Account,
    ]),
    SettingsModule,
  ],
  controllers: [ProductionController],
  providers: [
    ProductionService,
    CreateProductionProvider,
    CompleteProductionProvider,
    ProductionSerialProvider,
    RefreshPricesProvider,
  ],
  exports: [ProductionService],
})
export class ProductionModule {}
