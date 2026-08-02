import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, MaxLength } from 'class-validator';

export class ResendDto {
  @ApiProperty({
    description: 'Email address that may require verification.',
    example: 'pablo@example.com',
    maxLength: 254,
  })
  @IsEmail()
  @MaxLength(254)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
  email!: string;
}
