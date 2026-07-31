import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { TwoFactor } from './entities/two-factor.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { VerificationModule } from '../verification/verification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken, TwoFactor]),
    // timeout: sin esto axios no tiene límite y una caída de HIBP
    // dejaría el registro colgado (ver AuthService.isPasswordPwned).
    HttpModule.register({ timeout: 3000 }),
    JwtModule.register({
      global: true,
    }),
    UsersModule,
    VerificationModule,
    NotificationsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
