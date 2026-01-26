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
  CreateExpenseDto as ICreateExpenseDto,
  Category,
  PaymentMethod,
  CATEGORIES,
  PAYMENT_METHODS,
  VALIDATION,
} from '@wigtn/shared';

export class CreateExpenseDto implements ICreateExpenseDto {
  @ApiProperty({ description: 'Trip ID' })
  @IsString()
  tripId: string;

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

  @ApiProperty({ enum: PAYMENT_METHODS })
  @IsIn(PAYMENT_METHODS)
  paymentMethod: PaymentMethod;

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
