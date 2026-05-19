import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ProductionUnitItemDto {
  @ApiProperty()
  @IsInt()
  itemId: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class ProductionUnitDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  serialNumber: string;

  @ApiProperty({ type: [ProductionUnitItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductionUnitItemDto)
  items: ProductionUnitItemDto[];
}

export class CreateProductionDto {
  @ApiProperty()
  @IsInt()
  recipeId: number;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  quantity: number;

  @ApiProperty()
  @IsDateString()
  productionDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  copperAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  copperAccountId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [ProductionUnitDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductionUnitDto)
  units: ProductionUnitDto[];
}
