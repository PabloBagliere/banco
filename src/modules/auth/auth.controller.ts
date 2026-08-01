import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { CreateUserDto } from '../users/dto/createUser.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  signUp(@Body() signUpDto: CreateUserDto) {
    return this.authService.signUp(signUpDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: LoginDto, @Req() request: Request) {
    const ip = request.ip ?? null;
    const userAgent = request.get('user-agent') ?? null;
    return this.authService.signIn(signInDto, ip, userAgent);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refreshToken(@Body() refrehsDto: RefreshTokenDto, @Req() request: Request) {
    const ip = request.ip ?? null;
    const userAgent = request.get('user-agent') ?? null;
    return this.authService.refreshToken(refrehsDto, ip, userAgent);
  }
}
