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
import { SaleInvoiceItemDto } from './create-sale-invoice.dto';

export class UpdateSaleInvoiceDto {
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
