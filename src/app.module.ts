import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { CatchEverythingFilter } from './http-exception.filter';
import { LoggingInterceptor } from './logging.interceptor';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfig } from './config/app.config';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        type: 'postgres',
        url: config.databaseUrl,
        autoLoadEntities: true,
        synchronize: config.isDev,
      }),
    }),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: CatchEverythingFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
