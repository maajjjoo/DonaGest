import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
import { UuidParamPipe } from '../common/pipes/uuid-param.pipe';
import { DeliveryService } from './delivery.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { FilterDeliveryDto } from './dto/filter-delivery.dto';
import { RescheduleDeliveryDto } from './dto/reschedule-delivery.dto';
import { UpdateDeliveryNotesDto } from './dto/update-delivery-notes.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
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
      'La zona debe existir y estar activa, y la fecha no puede estar en el pasado (hora de Colombia). La cantidad se descuenta del inventario en la misma transacción en que se guarda la entrega.',
  })
  @ApiCreatedResponse({ description: 'Entrega programada', type: Delivery })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos, fecha en el pasado o zona inactiva',
  })
  @ApiResponse({ status: 404, description: 'No existe la zona o el producto' })
  @ApiResponse({ status: 409, description: 'Stock insuficiente' })
  create(@Body() dto: CreateDeliveryDto) {
    return this.deliveryService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'Listar entregas con filtros por zona, producto, estado y rango de fechas',
  })
  @ApiResponse({ status: 400, description: 'Filtros inválidos' })
  @ApiPaginatedResponse(Delivery)
  findAll(@Query() query: FilterDeliveryDto) {
    return this.deliveryService.findAll(query);
  }

  @Get('upcoming')
  @ApiOperation({
    summary: 'Entregas programadas para los próximos 7 días',
    description:
      'Incluye hoy y los siguientes 7 días (hora de Colombia), solo en estado PROGRAMADA. Si dos entregas son el mismo día, sale primero la zona con mayor prioridad.',
  })
  @ApiOkResponse({ type: Delivery, isArray: true })
  findUpcoming() {
    return this.deliveryService.findUpcoming();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar una entrega por su id' })
  @ApiOkResponse({ type: Delivery })
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido' })
  @ApiResponse({ status: 404, description: 'Entrega no encontrada' })
  findOne(@Param('id', UuidParamPipe) id: string) {
    return this.deliveryService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Cambiar el estado de una entrega',
    description:
      'PROGRAMADA → EN_TRANSITO o CANCELADA; EN_TRANSITO → ENTREGADA o CANCELADA. Al marcar ENTREGADA se guarda la fecha de entrega. Al CANCELAR la cantidad vuelve al inventario en la misma transacción.',
  })
  @ApiOkResponse({ type: Delivery })
  @ApiResponse({
    status: 400,
    description: 'Transición de estado no permitida',
  })
  @ApiResponse({ status: 404, description: 'Entrega no encontrada' })
  updateStatus(
    @Param('id', UuidParamPipe) id: string,
    @Body() dto: UpdateDeliveryStatusDto,
  ) {
    return this.deliveryService.updateStatus(id, dto);
  }

  @Patch(':id/reschedule')
  @ApiOperation({
    summary: 'Cambiar la fecha de una entrega',
    description:
      'Solo se pueden reprogramar entregas PROGRAMADAS y la nueva fecha no puede estar en el pasado (hora de Colombia).',
  })
  @ApiOkResponse({ type: Delivery })
  @ApiResponse({
    status: 400,
    description:
      'Fecha pasada, fecha inválida o entrega que no está PROGRAMADA',
  })
  @ApiResponse({ status: 404, description: 'Entrega no encontrada' })
  reschedule(
    @Param('id', UuidParamPipe) id: string,
    @Body() dto: RescheduleDeliveryDto,
  ) {
    return this.deliveryService.reschedule(id, dto);
  }

  @Patch(':id/notes')
  @ApiOperation({
    summary: 'Actualizar las observaciones de una entrega',
    description: 'Se puede hacer en cualquier estado. Enviar "" las borra.',
  })
  @ApiOkResponse({ type: Delivery })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Entrega no encontrada' })
  updateNotes(
    @Param('id', UuidParamPipe) id: string,
    @Body() dto: UpdateDeliveryNotesDto,
  ) {
    return this.deliveryService.updateNotes(id, dto);
  }
}
