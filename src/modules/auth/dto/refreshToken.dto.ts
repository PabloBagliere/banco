import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ example: '###################################################' })
  @IsNotEmpty()
  @IsJWT()
  refresh!: string;
}
