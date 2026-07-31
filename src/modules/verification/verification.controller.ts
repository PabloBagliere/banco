import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VerifyDto } from './dto/verify.dto';
import { VerificationService } from './verification.service';

@ApiTags('verification')
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('verify')
  verifyToken(@Body() token: VerifyDto) {
    return this.verificationService.verifyToken(token);
  }
}
