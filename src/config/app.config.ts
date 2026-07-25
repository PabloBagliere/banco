import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppConfig {
  constructor(private readonly config: ConfigService) {}

  get databaseUrl(): string {
    return this.config.getOrThrow('DATABASE_URL');
  }
  get jwtSecret(): string {
    return this.config.getOrThrow('JWT_SECRET');
  }
  get redisHost(): string {
    return this.config.getOrThrow('REDIS_HOST');
  }
  get dailyLimitArs(): number {
    return this.config.getOrThrow('DAILY_LIMIT_ARS');
  }
  get isDev(): boolean {
    return this.config.getOrThrow('NODE_ENV') === 'development';
  }
}
