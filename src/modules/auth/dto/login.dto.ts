import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'pablo@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'ClaveSegura2026!', format: 'password' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
