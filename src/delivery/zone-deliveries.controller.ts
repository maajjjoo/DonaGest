import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UuidParamPipe } from '../common/pipes/uuid-param.pipe';
import { DeliveryService } from './delivery.service';
import { Delivery } from './entities/delivery.entity';

@ApiTags('Zonas afectadas')
@Controller('affected-zones')
export class ZoneDeliveriesController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get(':id/deliveries')
  @ApiOperation({
    summary: 'Entregas de una zona afectada',
    description: 'Incluye todas las entregas de la zona, en cualquier estado.',
  })
  @ApiPaginatedResponse(Delivery)
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido' })
  @ApiResponse({ status: 404, description: 'Zona no encontrada' })
  findByZone(
    @Param('id', UuidParamPipe) id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.deliveryService.findByZone(id, query);
  }
}
