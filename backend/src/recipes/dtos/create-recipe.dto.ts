import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class RecipeItemDto {
  @ApiProperty()
  @IsNumber()
  itemId: number;

  @ApiProperty({ minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateRecipeDto {
  @ApiProperty({ maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNumber()
  finalProductId: number;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  additionalExpense?: number;

  @ApiProperty({ type: [RecipeItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeItemDto)
  items: RecipeItemDto[];
}
