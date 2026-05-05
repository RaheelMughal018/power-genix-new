import { PaginationQueryDto } from '@/common/pagination/dtos/pagination-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class SupplierPaymentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by supplier ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  supplierId?: number;

  @ApiPropertyOptional({ description: 'Filter by account ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  accountId?: number;

  @ApiPropertyOptional({ description: 'From date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'To date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
