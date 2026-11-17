import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { APP_VERSION } from '../common/constants/app.constants';
import { HealthResponseDto } from './dto/health-response.dto';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly dataSource: DataSource) {}

  async check(): Promise<HealthResponseDto> {
    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'ok',
        database: 'up',
        version: APP_VERSION,
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `La base de datos no responde: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new ServiceUnavailableException({
        message: 'La base de datos no responde',
        status: 'error',
        database: 'down',
        version: APP_VERSION,
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      });
    }
  }
}
