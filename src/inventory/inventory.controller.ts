import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UuidParamPipe } from '../common/pipes/uuid-param.pipe';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { FilterAlertsDto } from './dto/filter-alerts.dto';
import { UpdateMinimumStockDto } from './dto/update-minimum-stock.dto';
import { InventoryAdjustment } from './entities/inventory-adjustment.entity';
import { Inventory } from './entities/inventory.entity';
import { InventoryService } from './inventory.service';

@ApiTags('Inventario')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({
    summary: 'Consultar el inventario de todos los productos',
  })
  @ApiPaginatedResponse(Inventory)
  findAll(@Query() query: PaginationQueryDto) {
    return this.inventoryService.findAll(query);
  }

  @Get('alerts')
  @ApiOperation({
    summary: 'Listar productos con stock en el mínimo o por debajo',
    description:
      'Aparecen primero los productos a los que más les falta para llegar a su stock mínimo. Se puede filtrar por categoría.',
  })
  @ApiPaginatedResponse(Inventory)
  findAlerts(@Query() query: FilterAlertsDto) {
    return this.inventoryService.findAlerts(query);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Consultar el inventario de un producto' })
  @ApiOkResponse({ type: Inventory })
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido' })
  @ApiResponse({
    status: 404,
    description: 'No existe inventario para ese producto',
  })
  findByProduct(@Param('productId', UuidParamPipe) productId: string) {
    return this.inventoryService.findByProduct(productId);
  }

  @Get(':id/adjustments')
  @ApiOperation({
    summary: 'Historial de ajustes manuales de un inventario',
    description:
      'Muestra cada ajuste con la cantidad, el valor anterior, el nuevo y el motivo, del más reciente al más antiguo.',
  })
  @ApiPaginatedResponse(InventoryAdjustment)
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido' })
  @ApiResponse({ status: 404, description: 'Inventario no encontrado' })
  findAdjustments(
    @Param('id', UuidParamPipe) id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.inventoryService.findAdjustments(id, query);
  }

  @Patch(':id/minimum-stock')
  @ApiOperation({ summary: 'Cambiar el stock mínimo de un inventario' })
  @ApiOkResponse({ type: Inventory })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Inventario no encontrado' })
  updateMinimumStock(
    @Param('id', UuidParamPipe) id: string,
    @Body() dto: UpdateMinimumStockDto,
  ) {
    return this.inventoryService.updateMinimumStock(id, dto);
  }

  @Patch(':id/adjust')
  @ApiOperation({
    summary: 'Ajustar manualmente la cantidad disponible',
    description:
      'Suma o resta unidades con un motivo obligatorio (por ejemplo "producto vencido"). El inventario nunca puede quedar en negativo y cada ajuste queda registrado.',
  })
  @ApiOkResponse({ type: Inventory })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Inventario no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Stock insuficiente para descontar esa cantidad',
  })
  adjust(
    @Param('id', UuidParamPipe) id: string,
    @Body() dto: AdjustInventoryDto,
  ) {
    return this.inventoryService.adjust(id, dto);
  }
}
