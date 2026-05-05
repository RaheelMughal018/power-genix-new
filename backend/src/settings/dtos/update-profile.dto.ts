import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Raheel' })
  @IsString()
  @IsOptional()
  @MaxLength(90)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Ahmed' })
  @IsString()
  @IsOptional()
  @MaxLength(90)
  lastName?: string;

  @ApiPropertyOptional({ example: '+923001234567' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 'Lahore, Pakistan' })
  @IsString()
  @IsOptional()
  address?: string;
}
