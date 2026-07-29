import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Pablo Bagliere' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

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

  @ApiProperty({ example: 'pablobagliere', minLength: 4, maxLength: 30 })
  @IsString()
  @MinLength(4)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'username can only contain letters, numbers and underscores',
  })
  @Transform(({ value }) => (value as string)?.toLowerCase().trim())
  username!: string;
}
