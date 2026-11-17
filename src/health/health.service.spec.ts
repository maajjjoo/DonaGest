import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { APP_VERSION } from '../common/constants/app.constants';
import { HealthService } from './health.service';

describe('HealthService', () => {
  it('responde ok con la versión y el tiempo en línea', async () => {
    const dataSource = {
      query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };
    const service = new HealthService(dataSource as unknown as DataSource);

    const result = await service.check();

    expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
    expect(result).toMatchObject({
      status: 'ok',
      database: 'up',
      version: APP_VERSION,
    });
    expect(Number.isInteger(result.uptime)).toBe(true);
    expect(result.uptime).toBeGreaterThanOrEqual(0);
  });

  it('lanza 503 si la base de datos no responde', async () => {
    const dataSource = {
      query: jest.fn().mockRejectedValue(new Error('connect ECONNREFUSED')),
    };
    const service = new HealthService(dataSource as unknown as DataSource);
    const logSpy = jest
      .spyOn(
        (service as unknown as { logger: { error: () => void } }).logger,
        'error',
      )
      .mockImplementation(() => undefined);

    await expect(service.check()).rejects.toThrow(ServiceUnavailableException);
    logSpy.mockRestore();
  });

  it('usa la misma versión que package.json', () => {
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8'),
    ) as { version: string };

    expect(APP_VERSION).toBe(packageJson.version);
  });
});
