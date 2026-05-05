import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockAdjustment } from './entities/stock-adjustment.entity';
import { Item } from '@/items/entities/item.entity';
import { Supplier } from '@/suppliers/entities/supplier.entity';
import { StockAdjustmentsController } from './stock-adjustments.controller';
import { StockAdjustmentsService } from './providers/stock-adjustments.service';

@Module({
  imports: [TypeOrmModule.forFeature([StockAdjustment, Item, Supplier])],
  controllers: [StockAdjustmentsController],
  providers: [StockAdjustmentsService],
  exports: [StockAdjustmentsService],
})
export class StockAdjustmentsModule {}
