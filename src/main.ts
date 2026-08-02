import { ConsoleLogger, RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppConfig } from './infrastructure/config/app.config';

async function bootstrap() {
  // bufferLogs: los logs del boot se guardan y se reemiten con el logger
  // definitivo una vez que podemos leer la config validada (sin process.env).
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  const appConfig = app.get(AppConfig);
  app.set('trust proxy', 'loopback');
  app.useLogger(
    new ConsoleLogger({
      json: true,
      colors: !appConfig.isProd,
      compact: false,
    }),
  );

  app.use(helmet({ contentSecurityPolicy: false }));
  app.enableCors();
  app.setGlobalPrefix('api', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });

  const config = new DocumentBuilder()
    .setTitle('Banco API')
    .setDescription('Banking API learning project built with NestJS.')
    .setVersion('1.0.0')
    .addTag('auth', 'Registration, authentication, and authorization.')
    .addTag('verification', 'Email verification lifecycle.')
    .addTag('health', 'Operational health checks.')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token returned by the login or refresh endpoint.',
      },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  app.use('/docs', apiReference({ content: document }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableShutdownHooks();
  await app.listen(appConfig.port);
}
void bootstrap();
