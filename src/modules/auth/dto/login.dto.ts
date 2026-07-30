import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  IsStrongPassword,
  MaxLength,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'pablo@example.com' })
  @IsEmail()
  @MaxLength(254)
  @Transform(({ value }) => (value as string)?.toLowerCase().trim())
  email!: string;

  @ApiProperty({
    example: 'ClaveSegura2026!',
    format: 'password',
    minLength: 8,
  })
  @IsString()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  @MaxLength(72)
  password!: string;
}
