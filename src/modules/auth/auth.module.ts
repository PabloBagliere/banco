import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Account } from './entities/account.entity';
import { Session } from './entities/session.entity';
import { TwoFactor } from './entities/two-factor.entity';
import { User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Account, Session, Verification, TwoFactor]),
    HttpModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
