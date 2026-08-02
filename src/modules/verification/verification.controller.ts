import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResendDto } from './dto/resend.dto';
import { VerifyDto } from './dto/verify.dto';
import { VerificationService } from './verification.service';
import { Public } from '../../common/decorator/public.decorator';

@ApiTags('verification')
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Public()
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify an email address', description: 'Consumes a verification token sent by email.' })
  @ApiOkResponse({
    description: 'Email address verified.',
    schema: { example: { message: 'Email address verified successfully.' } },
  })
  @ApiBadRequestResponse({ description: 'The verification token is invalid or expired.' })
  verifyEmail(@Body() verifyDto: VerifyDto) {
    return this.verificationService.verifyToken(verifyDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('resend')
  @ApiOperation({ summary: 'Resend an email verification link' })
  @ApiOkResponse({
    description: 'Generic response to prevent email enumeration.',
    schema: { example: { message: 'If the email is eligible, a verification email will be sent.' } },
  })
  resendVerificationEmail(@Body() resendDto: ResendDto) {
    return this.verificationService.resendEmail(resendDto.email);
  }
}
