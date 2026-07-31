import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();

    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const start = Date.now();

    return next.handle().pipe(
      finalize(() => {
        this.logger.log('HTTP request completed', {
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          durationMs: Date.now() - start,
        });
      }),
    );
  }
}
