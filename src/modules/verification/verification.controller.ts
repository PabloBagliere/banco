import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { VerifyDto } from './dto/verify.dto';

@ApiTags('verification')
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('verify')
  verifyToken(@Body() token: VerifyDto) {
    return this.verificationService.verifyToken(token);
  }
}
