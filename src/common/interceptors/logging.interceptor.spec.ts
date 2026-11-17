import {
  CallHandler,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

const buildContext = (method: string, url: string, statusCode: number) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ method, url, originalUrl: url }),
      getResponse: () => ({ statusCode }),
    }),
  }) as unknown as ExecutionContext;

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let logger: { log: jest.Mock; warn: jest.Mock };

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
    logger = { log: jest.fn(), warn: jest.fn() };
    (interceptor as unknown as { logger: typeof logger }).logger = logger;
  });

  it('registra método, ruta, código y tiempo de una petición exitosa', async () => {
    const handler: CallHandler = { handle: () => of({ ok: true }) };

    await lastValueFrom(
      interceptor.intercept(
        buildContext('GET', '/api/v1/donors', 200),
        handler,
      ),
    );

    expect(logger.log).toHaveBeenCalledWith(
      expect.stringMatching(/^GET \/api\/v1\/donors 200 - \d+ ms$/),
    );
  });

  it('registra el código del error cuando la petición falla', async () => {
    const handler: CallHandler = {
      handle: () => throwError(() => new NotFoundException('No existe')),
    };

    await expect(
      lastValueFrom(
        interceptor.intercept(
          buildContext('DELETE', '/api/v1/donors/1', 200),
          handler,
        ),
      ),
    ).rejects.toThrow(NotFoundException);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringMatching(/^DELETE \/api\/v1\/donors\/1 404 - \d+ ms$/),
    );
  });

  it('usa 500 cuando el error no es HTTP', async () => {
    const handler: CallHandler = {
      handle: () => throwError(() => new Error('fallo')),
    };

    await expect(
      lastValueFrom(
        interceptor.intercept(
          buildContext('POST', '/api/v1/donations', 200),
          handler,
        ),
      ),
    ).rejects.toThrow('fallo');

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('POST /api/v1/donations 500'),
    );
  });
});
