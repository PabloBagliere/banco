import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Registered email address.', example: 'pablo@example.com', maxLength: 254 })
  @IsEmail()
  @MaxLength(254)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
  email!: string;

  @ApiProperty({
    example: 'ClaveSegura2026!',
    description: 'Account password.',
    format: 'password',
    maxLength: 72,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  password!: string;
}
