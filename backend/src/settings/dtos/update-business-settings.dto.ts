import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateBusinessSettingsDto {
  @ApiPropertyOptional({ example: 'Power Genix' })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  companyName?: string;

  @ApiPropertyOptional({ example: 'Lahore, Pakistan' })
  @IsString()
  @IsOptional()
  companyAddress?: string;

  @ApiPropertyOptional({ example: '+924235678901' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  companyPhone?: string;

  @ApiPropertyOptional({ example: 'LEH', description: 'Serial number prefix for production' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  serialPrefix?: string;

  @ApiPropertyOptional({ example: 7, description: 'Fiscal year start month (1-12)' })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(12)
  fiscalYearStart?: number;
}
