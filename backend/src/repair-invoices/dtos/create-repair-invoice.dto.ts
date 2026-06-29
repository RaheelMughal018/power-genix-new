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
  @ApiProperty()
  @IsNumber()
  itemId: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Override unit price (defaults to item average price)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  unitPrice?: number;

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

  @ApiPropertyOptional({ description: 'Discount amount — only applies to Charged invoices' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discount?: number;

  @ApiProperty({ description: 'true = Charged (customer pays); false = FOC (free of cost)' })
  @IsBoolean()
  isCharged: boolean;

  @ApiProperty({ type: [RepairInvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RepairInvoiceItemDto)
  items: RepairInvoiceItemDto[];
}
