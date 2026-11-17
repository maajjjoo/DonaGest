import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UuidParamPipe } from '../common/pipes/uuid-param.pipe';
import { DeliveryService } from './delivery.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { Delivery } from './entities/delivery.entity';

@ApiTags('Entregas')
@Controller('deliveries')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Programar una entrega a una zona afectada',
    description:
      'La zona debe existir y estar activa. La cantidad se descuenta del inventario en la misma transacción en que se guarda la entrega.',
  })
  @ApiCreatedResponse({ description: 'Entrega programada', type: Delivery })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o la zona está inactiva',
  })
  @ApiResponse({ status: 404, description: 'No existe la zona o el producto' })
  @ApiResponse({ status: 409, description: 'Stock insuficiente' })
  create(@Body() dto: CreateDeliveryDto) {
    return this.deliveryService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar entregas ordenadas por fecha programada' })
  @ApiPaginatedResponse(Delivery)
  findAll(@Query() query: PaginationQueryDto) {
    return this.deliveryService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar una entrega por su id' })
  @ApiOkResponse({ type: Delivery })
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido' })
  @ApiResponse({ status: 404, description: 'Entrega no encontrada' })
  findOne(@Param('id', UuidParamPipe) id: string) {
    return this.deliveryService.findOne(id);
  }
}
