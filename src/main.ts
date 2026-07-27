import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConsoleLogger, RequestMethod, ValidationPipe } from '@nestjs/common';
import { AppConfig } from './infrastructure/config/app.config';
import helmet from 'helmet';
import { apiReference } from '@scalar/nestjs-api-reference';

async function bootstrap() {
  // bufferLogs: los logs del boot se guardan y se reemiten con el logger
  // definitivo una vez que podemos leer la config validada (sin process.env).
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const appConfig = app.get(AppConfig);

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
    .setTitle('Banco Api')
    .setDescription('Banco API description')
    .setVersion('1.0')
    .addTag('bank')
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
