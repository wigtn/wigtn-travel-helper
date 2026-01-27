import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsIn,
  MaxLength,
} from 'class-validator';
import {
  Category,
  PaymentMethod,
  CATEGORIES,
  PAYMENT_METHODS,
  VALIDATION,
} from '@wigtn/shared';

export class CreateExpenseDto {
  // tripId is passed via URL param, not in body

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  destinationId?: string;

  @ApiProperty({ example: 25.5 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'EUR' })
  @IsString()
  @MaxLength(VALIDATION.CURRENCY_LENGTH)
  currency: string;

  @ApiProperty({ example: 1450.5 })
  @IsNumber()
  exchangeRate: number;

  @ApiProperty({ example: 36963 })
  @IsNumber()
  amountKRW: number;

  @ApiProperty({ enum: CATEGORIES })
  @IsIn(CATEGORIES)
  category: Category;

  @ApiPropertyOptional({ enum: PAYMENT_METHODS, default: 'card' })
  @IsOptional()
  @IsIn(PAYMENT_METHODS)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ example: '에펠탑 근처 카페' })
  @IsOptional()
  @IsString()
  @MaxLength(VALIDATION.DESCRIPTION_MAX)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(VALIDATION.MEMO_MAX)
  memo?: string;

  @ApiProperty({ example: '2025-01-20' })
  @IsDateString()
  expenseDate: string;

  @ApiPropertyOptional({ example: '14:30' })
  @IsOptional()
  @IsString()
  expenseTime?: string;
}
