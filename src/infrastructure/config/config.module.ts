import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validate } from './env.validation';
import { AppConfig } from './app.config';

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
