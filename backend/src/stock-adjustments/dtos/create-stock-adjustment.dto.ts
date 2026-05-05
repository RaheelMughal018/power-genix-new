import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateStockAdjustmentDto {
  @ApiProperty({ description: 'Item ID to adjust stock for' })
  @IsInt()
  @IsPositive()
  itemId: number;

  @ApiProperty({ description: 'Quantity to add or deduct', minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Unit price — required when type is add' })
  @ValidateIf((o: CreateStockAdjustmentDto) => o.type === AdjustmentType.ADD)
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  unitPrice?: number;

  @ApiProperty({ enum: AdjustmentType })
  @IsEnum(AdjustmentType)
  type: AdjustmentType;

  @ApiProperty({ enum: AdjustmentReason })
  @IsEnum(AdjustmentReason)
  reason: AdjustmentReason;

  @ApiPropertyOptional({ description: 'Supplier ID — required when reason is return_to_supplier' })
  @ValidateIf((o: CreateStockAdjustmentDto) => o.reason === AdjustmentReason.RETURN_TO_SUPPLIER)
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  supplierId?: number;

  @ApiPropertyOptional({ description: 'Optional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Adjustment date (YYYY-MM-DD)' })
  @IsDateString()
  date: string;
}
