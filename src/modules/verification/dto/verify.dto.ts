import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyDto {
  @ApiProperty({ description: 'Verification token received by email.', example: 'a3f5c8d1e7b9420f...' })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
