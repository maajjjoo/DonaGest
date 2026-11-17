import { ApiProperty } from '@nestjs/swagger';
import { AffectedZone } from '../../affected-zone/entities/affected-zone.entity';
import { ProductUnit } from '../../product/enums/product-unit.enum';
import { DeliveriesByStatusDto } from './summary-report.dto';

export class DeliveredProductDto {
  @ApiProperty({ example: '7995f153-f381-45e8-8b23-fedf0d0712fe' })
  productId: string;

  @ApiProperty({ example: 'Agua potable en bolsa 6 L' })
  productName: string;

  @ApiProperty({ enum: ProductUnit, example: ProductUnit.PAQUETE })
  unit: ProductUnit;

  @ApiProperty({ example: 240, description: 'Unidades ya entregadas' })
  unitsDelivered: number;
}

export class ZoneReportDto {
  @ApiProperty({ type: () => AffectedZone })
  zone: AffectedZone;

  @ApiProperty({ type: DeliveriesByStatusDto })
  deliveriesByStatus: DeliveriesByStatusDto;

  @ApiProperty({
    type: DeliveredProductDto,
    isArray: true,
    description: 'Unidades entregadas por producto (solo entregas ENTREGADAS)',
  })
  deliveredProducts: DeliveredProductDto[];

  @ApiProperty({ example: 360, description: 'Total de unidades entregadas' })
  totalUnitsDelivered: number;
}
