import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

function IsNotSameAs(property: string, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNotSameAs',
      target: (object as { constructor: Function }).constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const relatedValue = (args.object as Record<string, unknown>)[args.constraints[0]];
          return value !== relatedValue;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must not be the same as ${args.constraints[0]}`;
        },
      },
    });
  };
}

export class TransferDto {
  @ApiProperty({ description: 'Source account ID' })
  @IsNotEmpty()
  @IsNumber()
  @IsNotSameAs('toAccountId', { message: 'fromAccountId must not be the same as toAccountId' })
  fromAccountId: number;

  @ApiProperty({ description: 'Destination account ID' })
  @IsNotEmpty()
  @IsNumber()
  toAccountId: number;

  @ApiProperty({ description: 'Transfer amount', example: 500 })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ description: 'Transfer date (ISO date)', example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Optional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
