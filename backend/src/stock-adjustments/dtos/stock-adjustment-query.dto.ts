import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '@/common/pagination/dtos/pagination-query.dto';
import { AdjustmentType } from '../enums/adjustment-type.enum';
import { AdjustmentReason } from '../enums/adjustment-reason.enum';

export class StockAdjustmentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by item ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  itemId?: number;

  @ApiPropertyOptional({ description: 'Filter by supplier ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  supplierId?: number;

  @ApiPropertyOptional({ enum: AdjustmentType })
  @IsOptional()
  @IsEnum(AdjustmentType)
  type?: AdjustmentType;

  @ApiPropertyOptional({ enum: AdjustmentReason })
  @IsOptional()
  @IsEnum(AdjustmentReason)
  reason?: AdjustmentReason;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
