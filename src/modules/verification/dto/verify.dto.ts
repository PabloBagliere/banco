import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyDto {
  @ApiProperty({ example: '#################' })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
