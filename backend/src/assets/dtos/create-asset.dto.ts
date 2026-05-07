import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAssetDto {
  @ApiProperty({ description: 'Asset name', maxLength: 255 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Asset type (e.g. Equipment, Vehicle)', maxLength: 100 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  type: string;

  @ApiProperty({ description: 'Purchase amount' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Purchase date (YYYY-MM-DD)' })
  @IsDateString()
  purchaseDate: string;

  @ApiProperty({ description: 'Account to deduct from' })
  @IsNumber()
  @IsPositive()
  accountId: number;

  @ApiPropertyOptional({ description: 'Optional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
