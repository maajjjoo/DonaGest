import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { sendErrorResponse } from './error-response';
import { TypeOrmExceptionFilter } from './typeorm-exception.filter';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  private readonly typeOrmFilter = new TypeOrmExceptionFilter();

  catch(exception: unknown, host: ArgumentsHost): void {
    if (exception instanceof QueryFailedError) {
      this.typeOrmFilter.catch(exception, host);
      return;
    }

    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'string') {
        sendErrorResponse(request, response, status, body);
        return;
      }

      const {
        message,
        statusCode: _statusCode,
        error: _error,
        ...extra
      } = body as {
        message?: string | string[];
        statusCode?: number;
        error?: string;
      } & Record<string, unknown>;
      sendErrorResponse(
        request,
        response,
        status,
        message ?? exception.message,
        extra,
      );
      return;
    }

    this.logger.error(
      exception instanceof Error
        ? (exception.stack ?? exception.message)
        : String(exception),
    );
    sendErrorResponse(
      request,
      response,
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Ocurrió un error inesperado',
    );
  }
}
