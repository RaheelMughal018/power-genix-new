import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ExpenseLineDto {
  @ApiProperty({ description: 'Date of expense (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Description of expense', maxLength: 255 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  description: string;

  @ApiProperty({ description: 'Amount of expense' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Expense category ID' })
  @IsNumber()
  @IsPositive()
  categoryId: number;

  @ApiProperty({ description: 'Account to deduct from' })
  @IsNumber()
  @IsPositive()
  accountId: number;

  @ApiProperty({ description: 'Optional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateExpenseDto {
  @ApiProperty({ type: [ExpenseLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExpenseLineDto)
  expenses: ExpenseLineDto[];
}
