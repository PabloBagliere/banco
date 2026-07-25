import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validate } from '../env.validation';
import { AppConfig } from './app.config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      cache: true,
      validate,
    }),
  ],
  providers: [AppConfig],
  exports: [AppConfig],
})
export class ConfigModule {}
