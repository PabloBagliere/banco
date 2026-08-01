import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VerifyDto } from './dto/verify.dto';
import { VerificationService } from './verification.service';
import { Public } from '../../common/decorator/public.decorator';

@ApiTags('verification')
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Public()
  @Post('verify')
  verifyToken(@Body() token: VerifyDto) {
    return this.verificationService.verifyToken(token);
  }
}
