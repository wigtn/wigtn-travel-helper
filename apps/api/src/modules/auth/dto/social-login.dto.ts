import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';
import { SocialLoginDto as ISocialLoginDto } from '@wigtn/shared';

export class SocialLoginDto implements ISocialLoginDto {
  @ApiProperty({ enum: ['apple', 'google'], description: 'Social provider' })
  @IsIn(['apple', 'google'])
  provider: 'apple' | 'google';

  @ApiProperty({ description: 'ID Token from social provider' })
  @IsString()
  idToken: string;
}
