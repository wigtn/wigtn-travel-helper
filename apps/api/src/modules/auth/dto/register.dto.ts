import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { RegisterDto as IRegisterDto, VALIDATION } from '@wigtn/shared';

export class RegisterDto implements IRegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: VALIDATION.PASSWORD_MIN })
  @IsString()
  @MinLength(VALIDATION.PASSWORD_MIN)
  @MaxLength(VALIDATION.PASSWORD_MAX)
  password: string;

  @ApiProperty({ example: '홍길동' })
  @IsString()
  @MinLength(1)
  @MaxLength(VALIDATION.USER_NAME_MAX)
  name: string;
}
