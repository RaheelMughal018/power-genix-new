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
import { RepairInvoiceItemDto } from './create-repair-invoice.dto';

export class UpdateRepairInvoiceDto {
  @ApiProperty()
  @IsNumber()
  customerId: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  serialNumber?: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  laborCost?: number;

  @ApiProperty()
  @IsBoolean()
  isCharged: boolean;

  @ApiProperty({ type: [RepairInvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RepairInvoiceItemDto)
  items: RepairInvoiceItemDto[];
}
