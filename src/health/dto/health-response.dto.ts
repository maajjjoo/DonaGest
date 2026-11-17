import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok', enum: ['ok', 'error'] })
  status: 'ok' | 'error';

  @ApiProperty({ example: 'up', enum: ['up', 'down'] })
  database: 'up' | 'down';

  @ApiProperty({ example: '1.1.0', description: 'Versión de la API' })
  version: string;

  @ApiProperty({
    example: 3600,
    description: 'Segundos que lleva la API en línea',
  })
  uptime: number;

  @ApiProperty({ example: '2026-11-17T14:00:00.000Z' })
  timestamp: string;
}
