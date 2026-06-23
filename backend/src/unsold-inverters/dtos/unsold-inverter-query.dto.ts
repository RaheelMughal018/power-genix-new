import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '@/common/pagination/dtos/pagination-query.dto';

export class UnsoldInverterQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by produced item ID (recipe.finalProductId)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  itemId?: number;

  @ApiPropertyOptional({ description: 'From production date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'To production date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
