import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsNumber, MaxLength, Length } from 'class-validator';
import { CreateDestinationDto as ICreateDestinationDto, VALIDATION } from '@wigtn/shared';

export class CreateDestinationDto implements ICreateDestinationDto {
  @ApiProperty({ example: 'FR', description: 'ISO 3166-1 alpha-2 country code' })
  @IsString()
  @Length(2, 2)
  countryCode: string;

  @ApiProperty({ example: '프랑스' })
  @IsString()
  @MaxLength(VALIDATION.COUNTRY_MAX)
  country: string;

  @ApiPropertyOptional({ example: '파리' })
  @IsOptional()
  @IsString()
  @MaxLength(VALIDATION.CITY_MAX)
  city?: string;

  @ApiProperty({ example: 'EUR' })
  @IsString()
  @MaxLength(VALIDATION.CURRENCY_LENGTH)
  currency: any; // SupportedCurrency type from shared

  @ApiPropertyOptional({ example: '2025-01-15' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-01-20' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}
