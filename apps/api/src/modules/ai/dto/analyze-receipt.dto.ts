import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, ValidateNested, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';

export class AnalyzeReceiptDto {
  @ApiProperty({ description: 'Base64 encoded image' })
  @IsString()
  image: string;

  @ApiProperty({ example: 'image/jpeg', description: 'Image MIME type' })
  @IsString()
  mimeType: string;

  @ApiPropertyOptional({ description: 'Trip ID for auto expense creation' })
  @IsOptional()
  @IsString()
  tripId?: string;

  @ApiPropertyOptional({ description: 'Destination ID' })
  @IsOptional()
  @IsString()
  destinationId?: string;
}

export class BatchAnalyzeReceiptDto {
  @ApiProperty({ type: [AnalyzeReceiptDto], description: 'Array of receipts to analyze (max 10)' })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMaxSize(10)
  @Type(() => AnalyzeReceiptDto)
  receipts: AnalyzeReceiptDto[];
}
