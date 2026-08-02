import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { AppConfig } from '../../infrastructure/config/app.config';
import { JwtAccessPayload } from '../../modules/auth/interfaces/jwt-payload.interface';
import { IS_PUBLIC_KEY } from '../decorator/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: AppConfig,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublicRoute = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublicRoute) {
      return true;
    }
    const request = context.switchToHttp().getRequest<Request>();
    const accessToken = this.extractTokenFromHeader(request);
    if (!accessToken) {
      throw new UnauthorizedException('Authentication token is required.');
    }
    try {
      const payload = await this.jwtService.verifyAsync<JwtAccessPayload>(accessToken, {
        secret: this.config.jwtAccessSecret,
      });
      request.user = payload;
    } catch {
      throw new UnauthorizedException('Authentication token is invalid or expired.');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
