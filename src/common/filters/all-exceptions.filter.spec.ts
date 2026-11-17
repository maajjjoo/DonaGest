import {
  ArgumentsHost,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { AllExceptionsFilter } from './all-exceptions.filter';

const buildHost = (url: string) => {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  const request = { url, originalUrl: url };
  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;
  return { host, response };
};

const bodyOf = (response: { json: jest.Mock }) =>
  response.json.mock.calls[0][0] as Record<string, unknown>;

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  it('responde con statusCode, error, message, path y timestamp', () => {
    const { host, response } = buildHost('/api/v1/donors/123');

    filter.catch(new NotFoundException('No se encontró el donante'), host);

    expect(response.status).toHaveBeenCalledWith(404);
    const body = bodyOf(response);
    expect(body).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      message: 'No se encontró el donante',
      path: '/api/v1/donors/123',
    });
    expect(Number.isNaN(Date.parse(body.timestamp as string))).toBe(false);
  });

  it('conserva la lista de errores de validación', () => {
    const { host, response } = buildHost('/api/v1/products');

    filter.catch(
      new BadRequestException([
        'El nombre es obligatorio',
        'Categoría inválida',
      ]),
      host,
    );

    expect(bodyOf(response)).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: ['El nombre es obligatorio', 'Categoría inválida'],
    });
  });

  it('mantiene los datos extra de la excepción (como en /health)', () => {
    const { host, response } = buildHost('/api/v1/health');

    filter.catch(
      new ServiceUnavailableException({
        message: 'La base de datos no responde',
        status: 'error',
        database: 'down',
      }),
      host,
    );

    expect(bodyOf(response)).toMatchObject({
      statusCode: 503,
      error: 'Service Unavailable',
      message: 'La base de datos no responde',
      status: 'error',
      database: 'down',
    });
  });

  it('traduce el registro repetido de PostgreSQL a 409', () => {
    const { host, response } = buildHost('/api/v1/products');

    filter.catch(
      new QueryFailedError(
        'INSERT',
        [],
        Object.assign(new Error('duplicate key'), { code: '23505' }),
      ),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(409);
    expect(bodyOf(response)).toMatchObject({
      statusCode: 409,
      error: 'Conflict',
      message: 'El registro ya existe',
      path: '/api/v1/products',
    });
  });

  it('responde 500 sin mostrar detalles con un error desconocido', () => {
    const { host, response } = buildHost('/api/v1/donations');
    const logSpy = jest
      .spyOn(
        (filter as unknown as { logger: { error: () => void } }).logger,
        'error',
      )
      .mockImplementation(() => undefined);

    filter.catch(new Error('fallo interno con datos sensibles'), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(bodyOf(response).message).toBe('Ocurrió un error inesperado');
    logSpy.mockRestore();
  });
});
