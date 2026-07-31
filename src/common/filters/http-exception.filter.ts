import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Request } from 'express';

@Catch()
export class CatchEverythingFilter implements ExceptionFilter {
  private readonly logger = new Logger(CatchEverythingFilter.name);
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const req = ctx.getRequest<Request>();
    const method: string = req.method;
    // getRequestUrl está tipado como `any` en @nestjs/core
    const url: string = httpAdapter.getRequestUrl(req) as string;

    if (httpStatus >= 500) {
      this.logger.error(
        `${method} ${url} → ${httpStatus}`,
        (exception as Error)?.stack,
      );
    } else {
      this.logger.warn(`${method} ${url} → ${httpStatus}`);
    }

    const responseBody =
      exception instanceof HttpException
        ? this.buildFromHttpException(exception, httpStatus, url)
        : {
            statusCode: httpStatus,
            message: 'Internal server error',
            error: 'Internal Server Error',
            timestamp: new Date().toISOString(),
            path: url,
          };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }

  private buildFromHttpException(
    exception: HttpException,
    statusCode: number,
    path: string,
  ) {
    const response = exception.getResponse();
    return {
      statusCode,
      timestamp: new Date().toISOString(),
      path,
      // getResponse() devuelve objeto ({ message, error }) o un string plano
      ...(typeof response === 'object' && response !== null
        ? response
        : { message: response }),
    };
  }
}
