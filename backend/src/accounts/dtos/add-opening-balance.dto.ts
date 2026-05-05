import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class AddOpeningBalanceDto {
  @ApiProperty({ description: 'Opening balance amount', example: 1000 })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amount: number;
}
