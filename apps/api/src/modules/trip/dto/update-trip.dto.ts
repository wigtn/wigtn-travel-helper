import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsNumber, IsIn, MaxLength } from 'class-validator';
import { UpdateTripDto as IUpdateTripDto, VALIDATION, TripStatus, TRIP_STATUSES } from '@wigtn/shared';

export class UpdateTripDto implements IUpdateTripDto {
  @ApiPropertyOptional({ example: '유럽 배낭여행' })
  @IsOptional()
  @IsString()
  @MaxLength(VALIDATION.TRIP_NAME_MAX)
  name?: string;

  @ApiPropertyOptional({ example: '2025-01-15' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

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

  @ApiPropertyOptional({ enum: TRIP_STATUSES })
  @IsOptional()
  @IsIn(TRIP_STATUSES)
  status?: TripStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImage?: string;
}
