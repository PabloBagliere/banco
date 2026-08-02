import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import type { JwtAccessPayload } from './interfaces/jwt-payload.interface';
import { CurrentUser } from '../../common/decorator/current-user.decorator';
import { Public } from '../../common/decorator/public.decorator';
import { Roles } from '../../common/decorator/roles.decorator';
import { CreateUserDto } from '../users/dto/createUser.dto';
import { UserRole } from '../users/entities/user-role.enum';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register a user',
    description: 'Creates a credentials account and sends an email verification link.',
  })
  @ApiCreatedResponse({
    description: 'User registered successfully.',
    schema: {
      example: {
        message: 'Registration successful. Verify your email address to sign in.',
        data: {
          username: 'pablo',
          email: 'pablo@example.com',
          emailVerified: false,
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'The request body is invalid or the password is compromised.' })
  @ApiConflictResponse({ description: 'The email or username is already registered.' })
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Authenticate a user', description: 'Returns access and refresh tokens.' })
  @ApiOkResponse({
    description: 'Authentication completed successfully.',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        expiresIn: 900000,
        refreshExpiresIn: 604800000,
        tokenType: 'Bearer',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'The email or password is invalid.' })
  @ApiForbiddenResponse({ description: 'The account is suspended.' })
  login(@Body() loginDto: LoginDto, @Req() request: Request) {
    const ip = request.ip ?? null;
    const userAgent = request.get('user-agent') ?? null;
    return this.authService.login(loginDto, ip, userAgent);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh a session', description: 'Rotates a valid refresh token.' })
  @ApiOkResponse({
    description: 'Session refreshed successfully.',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        expiresIn: 900000,
        refreshExpiresIn: 604800000,
        tokenType: 'Bearer',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'The refresh token is invalid or expired.' })
  @ApiForbiddenResponse({ description: 'The account is suspended.' })
  refreshSession(@Body() refreshTokenDto: RefreshTokenDto, @Req() request: Request) {
    const ip = request.ip ?? null;
    const userAgent = request.get('user-agent') ?? null;
    return this.authService.refreshSession(refreshTokenDto, ip, userAgent);
  }

  @ApiBearerAuth('access-token')
  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiOkResponse({
    description: 'Authenticated user profile.',
    schema: {
      example: {
        id: 'd0fd3d12-254b-4d30-b6c6-a25c9b4c1a2d',
        email: 'pablo@example.com',
        image: null,
        username: 'pablo',
        displayName: 'pablo',
        name: 'Pablo Bagliere',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'The authentication token is missing, invalid, or expired.' })
  @ApiForbiddenResponse({ description: 'The account is suspended.' })
  getProfile(@CurrentUser() user: JwtAccessPayload) {
    return this.authService.getProfile(user.sub);
  }

  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN)
  @Get('admin')
  @ApiOperation({ summary: 'Verify administrator access', description: 'Example route protected by the ADMIN role.' })
  @ApiOkResponse({
    description: 'Administrator access granted.',
    schema: { example: { message: 'Administrator access granted.' } },
  })
  @ApiUnauthorizedResponse({ description: 'The authentication token is missing, invalid, or expired.' })
  @ApiForbiddenResponse({ description: 'The authenticated user does not have the ADMIN role.' })
  verifyAdministratorAccess() {
    return { message: 'Administrator access granted.' };
  }
}
