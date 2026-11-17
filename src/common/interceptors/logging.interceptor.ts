import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const start = Date.now();
    const route = `${request.method} ${request.originalUrl ?? request.url}`;

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(
            `${route} ${response.statusCode} - ${Date.now() - start} ms`,
          );
        },
        error: (error: unknown) => {
          const status =
            error instanceof HttpException
              ? error.getStatus()
              : HttpStatus.INTERNAL_SERVER_ERROR;
          this.logger.warn(`${route} ${status} - ${Date.now() - start} ms`);
        },
      }),
    );
  }
}
