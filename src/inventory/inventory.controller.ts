import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UuidParamPipe } from '../common/pipes/uuid-param.pipe';
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
}
