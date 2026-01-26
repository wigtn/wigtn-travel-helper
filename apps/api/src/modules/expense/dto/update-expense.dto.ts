import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsIn,
  MaxLength,
} from 'class-validator';
import {
  UpdateExpenseDto as IUpdateExpenseDto,
  Category,
  PaymentMethod,
  CATEGORIES,
  PAYMENT_METHODS,
  VALIDATION,
} from '@wigtn/shared';

export class UpdateExpenseDto implements IUpdateExpenseDto {
  @ApiPropertyOptional({ example: 25.5 })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ example: 'EUR' })
  @IsOptional()
  @IsString()
  @MaxLength(VALIDATION.CURRENCY_LENGTH)
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  exchangeRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  amountKRW?: number;

  @ApiPropertyOptional({ enum: CATEGORIES })
  @IsOptional()
  @IsIn(CATEGORIES)
  category?: Category;

  @ApiPropertyOptional({ enum: PAYMENT_METHODS })
  @IsOptional()
  @IsIn(PAYMENT_METHODS)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(VALIDATION.DESCRIPTION_MAX)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(VALIDATION.MEMO_MAX)
  memo?: string;

  @ApiPropertyOptional({ example: '2025-01-20' })
  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  @ApiPropertyOptional({ example: '14:30' })
  @IsOptional()
  @IsString()
  expenseTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  destinationId?: string;
}
