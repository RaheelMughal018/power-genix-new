import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString, MaxLength, MinLength } from 'class-validator';
import { ItemType } from '../enums/item-type.enum';
import { ItemUnit } from '../enums/item-unit.enum';

export class CreateItemDto {
  @ApiProperty({ description: 'Item name', minLength: 2, maxLength: 150 })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @ApiProperty({ description: 'Category ID' })
  @IsNotEmpty()
  @IsNumber()
  categoryId: number;

  @ApiProperty({ description: 'Item type', enum: ItemType })
  @IsNotEmpty()
  @IsEnum(ItemType)
  type: ItemType;

  @ApiProperty({ description: 'Item unit', enum: ItemUnit })
  @IsNotEmpty()
  @IsEnum(ItemUnit)
  unit: ItemUnit;
}
