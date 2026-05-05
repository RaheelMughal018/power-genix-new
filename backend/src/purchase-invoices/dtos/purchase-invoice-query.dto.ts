import { PaginationQueryDto } from '@/common/pagination/dtos/pagination-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional } from 'class-validator';

export class PurchaseInvoiceQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by supplier ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  supplierId?: number;

  @ApiPropertyOptional({ description: 'Filter from this date (inclusive)', example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Filter to this date (inclusive)', example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
