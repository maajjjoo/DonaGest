import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

interface PostgresDriverError {
  code?: string;
  detail?: string;
}

const POSTGRES_ERRORS: Record<
  string,
  { status: HttpStatus; error: string; message: string }
> = {
  '23505': {
    status: HttpStatus.CONFLICT,
    error: 'Conflict',
    message: 'El registro ya existe',
  },
  '23503': {
    status: HttpStatus.CONFLICT,
    error: 'Conflict',
    message:
      'No se puede completar la operación porque el registro está relacionado con otros datos',
  },
  '22P02': {
    status: HttpStatus.BAD_REQUEST,
    error: 'Bad Request',
    message: 'Uno de los valores enviados no tiene un formato válido',
  },
};

@Catch(QueryFailedError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(TypeOrmExceptionFilter.name);

  catch(exception: QueryFailedError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const driverError = exception.driverError as PostgresDriverError;
    const known = driverError?.code
      ? POSTGRES_ERRORS[driverError.code]
      : undefined;

    if (!known) {
      this.logger.error(exception.message);
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: 'Ocurrió un error inesperado en la base de datos',
      });
      return;
    }

    response.status(known.status).json({
      statusCode: known.status,
      error: known.error,
      message: known.message,
    });
  }
}
