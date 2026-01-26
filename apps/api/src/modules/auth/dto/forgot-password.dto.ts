import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import { ForgotPasswordDto as IForgotPasswordDto } from '@wigtn/shared';

export class ForgotPasswordDto implements IForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}
