import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Pablo Bagliere' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'pablo@example.com' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  // Requisito explícito: 8+ chars, minúscula, mayúscula, número y símbolo.
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

  @ApiProperty({ example: 'pablobagliere', minLength: 4, maxLength: 30 })
  @IsString()
  @MinLength(4)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'username can only contain letters, numbers and underscores',
  })
  username!: string;
}
