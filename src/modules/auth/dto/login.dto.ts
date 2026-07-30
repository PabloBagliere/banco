import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'pablo@example.com' })
  @IsEmail()
  @MaxLength(254)
  @Transform(({ value }) => (value as string)?.toLowerCase().trim())
  email!: string;

  @ApiProperty({
    example: 'ClaveSegura2026!',
    format: 'password',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  password!: string;
}
