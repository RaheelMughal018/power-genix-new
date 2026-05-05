import { PaginationQueryDto } from '@/common/pagination/dtos/pagination-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ItemType } from '../enums/item-type.enum';

export class ItemQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by item type', enum: ItemType })
  @IsOptional()
  @IsEnum(ItemType)
  type?: ItemType;

  @ApiPropertyOptional({
    description: 'Filter by stock status',
    enum: ['in_stock', 'out_of_stock'],
  })
  @IsOptional()
  @IsEnum(['in_stock', 'out_of_stock'])
  stockStatus?: 'in_stock' | 'out_of_stock';

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  categoryId?: number;
}
