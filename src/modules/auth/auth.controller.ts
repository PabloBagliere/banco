import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { Public } from '../../common/decorator/public.decorator';
import { CreateUserDto } from '../users/dto/createUser.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  signUp(@Body() signUpDto: CreateUserDto) {
    return this.authService.signUp(signUpDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: LoginDto, @Req() request: Request) {
    const ip = request.ip ?? null;
    const userAgent = request.get('user-agent') ?? null;
    return this.authService.signIn(signInDto, ip, userAgent);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refreshToken(@Body() refrehsDto: RefreshTokenDto, @Req() request: Request) {
    const ip = request.ip ?? null;
    const userAgent = request.get('user-agent') ?? null;
    return this.authService.refreshToken(refrehsDto, ip, userAgent);
  }

  @Get('me')
  me(@Req() request: Request) {
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('Not user');
    }
    return this.authService.getUserMe(user.sub);
  }
}
