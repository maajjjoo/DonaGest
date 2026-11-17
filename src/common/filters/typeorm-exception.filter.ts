import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { sendErrorResponse } from './error-response';

interface PostgresDriverError {
  code?: string;
  detail?: string;
}

const POSTGRES_ERRORS: Record<string, { status: HttpStatus; message: string }> =
  {
    '23505': {
      status: HttpStatus.CONFLICT,
      message: 'El registro ya existe',
    },
    '23503': {
      status: HttpStatus.CONFLICT,
      message:
        'No se puede completar la operación porque el registro está relacionado con otros datos',
    },
    '22P02': {
      status: HttpStatus.BAD_REQUEST,
      message: 'Uno de los valores enviados no tiene un formato válido',
    },
  };

@Catch(QueryFailedError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(TypeOrmExceptionFilter.name);

  catch(exception: QueryFailedError, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const driverError = exception.driverError as PostgresDriverError;
    const known = driverError?.code
      ? POSTGRES_ERRORS[driverError.code]
      : undefined;

    if (!known) {
      this.logger.error(exception.message);
      sendErrorResponse(
        request,
        response,
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Ocurrió un error inesperado en la base de datos',
      );
      return;
    }

    sendErrorResponse(request, response, known.status, known.message);
  }
}
