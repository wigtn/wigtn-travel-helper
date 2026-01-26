import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsArray,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTripDto as ICreateTripDto, VALIDATION } from '@wigtn/shared';
import { CreateDestinationDto } from './create-destination.dto';

export class CreateTripDto implements ICreateTripDto {
  @ApiProperty({ example: '유럽 배낭여행' })
  @IsString()
  @MaxLength(VALIDATION.TRIP_NAME_MAX)
  name: string;

  @ApiProperty({ example: '2025-01-15' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2025-01-28' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 3000000 })
  @IsOptional()
  @IsNumber()
  budget?: number;

  @ApiPropertyOptional({ example: 'KRW' })
  @IsOptional()
  @IsString()
  budgetCurrency?: string;

  @ApiProperty({ type: [CreateDestinationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDestinationDto)
  destinations: CreateDestinationDto[];
}
