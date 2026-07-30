import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { VerifyDto } from './dto/verify.dto';

@ApiTags('verification')
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get()
  verifyToken(token: VerifyDto) {
    return this.verifyToken(token);
  }
}
