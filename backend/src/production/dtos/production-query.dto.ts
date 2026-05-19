import { PaginationQueryDto } from '@/common/pagination/dtos/pagination-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ProductionStatus } from '../enums/production-status.enum';

export class ProductionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by batch status',
    enum: ProductionStatus,
  })
  @IsOptional()
  @IsEnum(ProductionStatus)
  status?: ProductionStatus;

  @ApiPropertyOptional({ description: 'Filter production date from (inclusive)', example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Filter production date to (inclusive)', example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
