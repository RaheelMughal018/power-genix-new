import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { AdjustmentType } from '../enums/adjustment-type.enum';
import { AdjustmentReason } from '../enums/adjustment-reason.enum';

export class UpdateStockAdjustmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  itemId?: number;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional()
  @ValidateIf((o: UpdateStockAdjustmentDto) => o.type === AdjustmentType.ADD)
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  unitPrice?: number;

  @ApiPropertyOptional({ enum: AdjustmentType })
  @IsOptional()
  @IsEnum(AdjustmentType)
  type?: AdjustmentType;

  @ApiPropertyOptional({ enum: AdjustmentReason })
  @IsOptional()
  @IsEnum(AdjustmentReason)
  reason?: AdjustmentReason;

  @ApiPropertyOptional()
  @ValidateIf((o: UpdateStockAdjustmentDto) => o.reason === AdjustmentReason.RETURN_TO_SUPPLIER)
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  supplierId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;
}
