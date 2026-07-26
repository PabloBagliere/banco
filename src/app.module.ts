import { Module } from '@nestjs/common';
import { ConfigModule } from './infrastructure/config/config.module';
import { CatchEverythingFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfig } from './infrastructure/config/app.config';
import { HealthModule } from './modules/health/health.module';

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
    HealthModule,
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
