import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateCustomerPaymentDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsNumber()
  @IsPositive()
  customerId: number;

  @ApiProperty({ description: 'Payment amount', example: 5000.0 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ description: 'Account ID to credit' })
  @IsNumber()
  @IsPositive()
  accountId: number;

  @ApiProperty({ description: 'Payment date (YYYY-MM-DD)', example: '2026-01-15' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ description: 'Optional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
