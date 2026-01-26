import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, Length } from 'class-validator';
import { ResetPasswordDto as IResetPasswordDto, VALIDATION } from '@wigtn/shared';

export class ResetPasswordDto implements IResetPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', description: '6자리 인증 코드' })
  @IsString()
  @Length(6, 6)
  code: string;

  @ApiProperty({ example: 'newPassword123', minLength: VALIDATION.PASSWORD_MIN })
  @IsString()
  @MinLength(VALIDATION.PASSWORD_MIN)
  @MaxLength(VALIDATION.PASSWORD_MAX)
  newPassword: string;
}
