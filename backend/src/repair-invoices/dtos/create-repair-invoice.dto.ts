import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class RepairInvoiceItemDto {
  @ApiPropertyOptional({ description: 'Required when not a custom item' })
  @IsNumber()
  @IsOptional()
  itemId?: number;

  @ApiPropertyOptional({ description: 'Name for custom (non-stock) items' })
  @IsString()
  @IsOptional()
  customItemName?: string;

  @ApiPropertyOptional({ description: 'Unit price for custom items (overrides stock price)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  customUnitPrice?: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'true = deduct stock + add cost; false = add price only, no stock deduction' })
  @IsBoolean()
  isReal: boolean;
}

export class CreateRepairInvoiceDto {
  @ApiProperty()
  @IsNumber()
  customerId: number;

  @ApiPropertyOptional({ description: 'Serial number (only for inverters sold by this business)' })
  @IsString()
  @IsOptional()
  serialNumber?: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ example: '2025-01-15' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ description: 'Labor cost — only applies to Charged invoices' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  laborCost?: number;

  @ApiProperty({ description: 'true = Charged (customer pays); false = FOC (free of cost)' })
  @IsBoolean()
  isCharged: boolean;

  @ApiProperty({ type: [RepairInvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RepairInvoiceItemDto)
  items: RepairInvoiceItemDto[];
}
