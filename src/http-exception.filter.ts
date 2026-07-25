import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const req = ctx.getRequest();
    const method: string = req.method;
    const url: string = httpAdapter.getRequestUrl(req);

    const response =
      exception instanceof HttpException ? exception.getResponse() : {};
    this.logger.warn(`HTTP ${httpStatus} ${method} ${url}`, { exception });

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: url,
      ...(typeof response === 'object' && response !== null
        ? response
        : { error: response }),
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
