import { ApiProperty } from '@nestjs/swagger';

export class DonorsSummaryDto {
  @ApiProperty({ example: 4, description: 'Donantes registrados' })
  total: number;
}

export class DonationsSummaryDto {
  @ApiProperty({ example: 12, description: 'Donaciones en estado RECIBIDA' })
  received: number;

  @ApiProperty({ example: 1, description: 'Donaciones anuladas' })
  cancelled: number;

  @ApiProperty({
    example: 4350,
    description: 'Unidades donadas (solo donaciones recibidas)',
  })
  unitsDonated: number;
}

export class DeliveriesByStatusDto {
  @ApiProperty({ example: 3 })
  PROGRAMADA: number;

  @ApiProperty({ example: 1 })
  EN_TRANSITO: number;

  @ApiProperty({ example: 5 })
  ENTREGADA: number;

  @ApiProperty({ example: 1 })
  CANCELADA: number;

  @ApiProperty({ example: 10 })
  total: number;
}

export class ZonesByPriorityDto {
  @ApiProperty({ example: 1 })
  CRITICA: number;

  @ApiProperty({ example: 2 })
  ALTA: number;

  @ApiProperty({ example: 1 })
  MEDIA: number;

  @ApiProperty({ example: 0 })
  BAJA: number;

  @ApiProperty({ example: 4 })
  total: number;
}

export class SummaryReportDto {
  @ApiProperty({ type: DonorsSummaryDto })
  donors: DonorsSummaryDto;

  @ApiProperty({ type: DonationsSummaryDto })
  donations: DonationsSummaryDto;

  @ApiProperty({ type: DeliveriesByStatusDto })
  deliveries: DeliveriesByStatusDto;

  @ApiProperty({
    type: ZonesByPriorityDto,
    description: 'Zonas activas agrupadas por prioridad',
  })
  activeZonesByPriority: ZonesByPriorityDto;

  @ApiProperty({
    example: 2,
    description: 'Productos con stock en el mínimo o por debajo',
  })
  productsInAlert: number;

  @ApiProperty({ example: '2026-11-17T14:00:00.000Z' })
  generatedAt: Date;
}
