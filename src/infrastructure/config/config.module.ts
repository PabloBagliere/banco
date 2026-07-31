import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { AppConfig } from './app.config';
import { validate } from './env.validation';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      validate,
    }),
  ],
  providers: [AppConfig],
  exports: [AppConfig],
})
export class ConfigModule {}
