import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { Environment } from './env.validation';
import { StringValue } from 'ms';

@Injectable()
export class AppConfig {
  constructor(private readonly config: ConfigService<Environment, true>) {}

  // App
  get nodeEnv(): Environment['NODE_ENV'] {
    return this.config.getOrThrow('NODE_ENV');
  }
  get port(): number {
    return this.config.getOrThrow('PORT');
  }
  get isDev(): boolean {
    return this.nodeEnv === 'development';
  }
  get isProd(): boolean {
    return this.nodeEnv === 'production';
  }

  // PostgreSQL
  get databaseUrl(): string {
    return this.config.getOrThrow('DATABASE_URL');
  }
  get postgresUser(): string {
    return this.config.getOrThrow('POSTGRES_USER');
  }
  get postgresPassword(): string {
    return this.config.getOrThrow('POSTGRES_PASSWORD');
  }
  get postgresDb(): string {
    return this.config.getOrThrow('POSTGRES_DB');
  }
  get postgresPort(): number {
    return this.config.getOrThrow('POSTGRES_PORT');
  }

  // Redis
  get redisHost(): string {
    return this.config.getOrThrow('REDIS_HOST');
  }
  get redisPort(): number {
    return this.config.getOrThrow('REDIS_PORT');
  }

  // JWT (Fase 1)
  get jwtAccessSecret(): string {
    return this.config.getOrThrow('JWT_ACCESS_SECRET');
  }
  get jwtRefreshSecret(): string {
    return this.config.getOrThrow('JWT_REFRESH_SECRET');
  }
  get jwtAccessExpiresIn(): StringValue {
    return this.config.getOrThrow('JWT_ACCESS_EXPIRES_IN');
  }
  get jwtRefreshExpiresIn(): StringValue {
    return this.config.getOrThrow('JWT_REFRESH_EXPIRES_IN');
  }

  // Reglas de negocio (Fases 3 y 4)
  get dailyLimitStandardArs(): number {
    return this.config.getOrThrow('DAILY_LIMIT_STANDARD_ARS');
  }
  get dailyLimitPremiumArs(): number {
    return this.config.getOrThrow('DAILY_LIMIT_PREMIUM_ARS');
  }
  get transferFeeStandardArs(): number {
    return this.config.getOrThrow('TRANSFER_FEE_STANDARD_ARS');
  }
  get reversalWindowHours(): number {
    return this.config.getOrThrow('REVERSAL_WINDOW_HOURS');
  }
  get fraudMaxTransfersPerWindow(): number {
    return this.config.getOrThrow('FRAUD_MAX_TRANSFERS_PER_WINDOW');
  }
  get fraudWindowMinutes(): number {
    return this.config.getOrThrow('FRAUD_WINDOW_MINUTES');
  }
  get fxRateArsUsd(): number {
    return this.config.getOrThrow('FX_RATE_ARS_USD');
  }

  // Email (Resend - verificación de correo)
  get resendApiKey(): string {
    return this.config.getOrThrow('RESEND_API_KEY');
  }
  get appDomain(): string {
    return this.config.getOrThrow('APP_DOMAIN');
  }
  get emailFrom(): string {
    return this.config.getOrThrow('EMAIL_FROM');
  }
}
