import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'Legal or display name of the user.', example: 'Pablo Bagliere', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ description: 'Unique email address used to sign in.', example: 'pablo@example.com', maxLength: 254 })
  @IsEmail()
  @MaxLength(254)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
  email!: string;

  @ApiProperty({
    example: 'ClaveSegura2026!',
    description: 'Password with uppercase, lowercase, number, and symbol characters.',
    format: 'password',
    minLength: 8,
    maxLength: 72,
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

  @ApiProperty({
    description: 'Unique username containing letters, numbers, or underscores.',
    example: 'pablobagliere',
    minLength: 4,
    maxLength: 30,
    pattern: '^\\w+$',
  })
  @IsString()
  @MinLength(4)
  @MaxLength(30)
  @Matches(/^\w+$/, {
    message: 'Username can only contain letters, numbers, and underscores.',
  })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
  username!: string;
}
