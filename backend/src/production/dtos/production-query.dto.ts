import { PaginationQueryDto } from '@/common/pagination/dtos/pagination-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ProductionStatus } from '../enums/production-status.enum';

export class ProductionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by batch status',
    enum: ProductionStatus,
  })
  @IsOptional()
  @IsEnum(ProductionStatus)
  status?: ProductionStatus;
}
