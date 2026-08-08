import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAccountDto {
  @ApiProperty({ description: 'Enabled account product code.', format: 'string' })
  @IsNotEmpty()
  @IsString()
  code!: string;
}
