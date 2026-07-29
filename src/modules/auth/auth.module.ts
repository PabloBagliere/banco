import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { TwoFactor } from './entities/two-factor.entity';
import { Verification } from './entities/verification.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken, Verification, TwoFactor]),
    // timeout: sin esto axios no tiene límite y una caída de HIBP
    // dejaría el registro colgado (ver AuthService.isPasswordPwned).
    HttpModule.register({ timeout: 3000 }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
