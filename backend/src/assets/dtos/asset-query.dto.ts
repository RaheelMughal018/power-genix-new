import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { PaginationQueryDto } from '@/common/pagination/dtos/pagination-query.dto';
import { Type } from 'class-transformer';

export class AssetQueryDto extends PaginationQueryDto {
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
