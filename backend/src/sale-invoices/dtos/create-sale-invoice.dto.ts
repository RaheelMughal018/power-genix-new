import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class SaleInvoiceItemDto {
  @ApiProperty()
  @IsNumber()
  itemId: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ description: 'Serial number for inverter items' })
  @IsString()
  @IsOptional()
  serialNumber?: string;
}

export class CreateSaleInvoiceDto {
  @ApiProperty()
  @IsNumber()
  customerId: number;

  @ApiProperty()
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [SaleInvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleInvoiceItemDto)
  items: SaleInvoiceItemDto[];
}
