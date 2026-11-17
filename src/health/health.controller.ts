import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HealthResponseDto } from './dto/health-response.dto';
import { HealthService } from './health.service';

@ApiTags('Salud')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Estado de la API y de la base de datos',
    description:
      'Hace un SELECT 1 a PostgreSQL y muestra la versión de la API y los segundos que lleva en línea. Si la base de datos no responde devuelve 503.',
  })
  @ApiOkResponse({ type: HealthResponseDto })
  @ApiServiceUnavailableResponse({
    description: 'La base de datos no responde',
    type: HealthResponseDto,
  })
  check() {
    return this.healthService.check();
  }
}
