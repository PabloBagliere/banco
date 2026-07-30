import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { TwoFactor } from './entities/two-factor.entity';
import { UsersModule } from '../users/users.module';
import { VerificationModule } from '../verification/verification.module';
import { NotificationsModule } from '../notifications/notifications.module';

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
