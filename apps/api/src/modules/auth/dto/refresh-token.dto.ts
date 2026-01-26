import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { RefreshTokenDto as IRefreshTokenDto } from '@wigtn/shared';

export class RefreshTokenDto implements IRefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}
