import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UuidParamPipe } from '../common/pipes/uuid-param.pipe';
import { CreateProductDto } from './dto/create-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductService } from './product.service';

@ApiTags('Productos')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un producto',
    description:
      'Al crear el producto también se crea su inventario con cantidad 0.',
  })
  @ApiCreatedResponse({ description: 'Producto registrado', type: Product })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un producto con ese nombre',
  })
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'Listar productos con su inventario, filtro por categoría y búsqueda',
  })
  @ApiPaginatedResponse(Product)
  findAll(@Query() query: FilterProductDto) {
    return this.productService.findAll(query);
  }

  @Get('out-of-stock')
  @ApiOperation({
    summary: 'Listar productos agotados',
    description: 'Productos cuyo inventario disponible está en 0.',
  })
  @ApiPaginatedResponse(Product)
  findOutOfStock(@Query() query: PaginationQueryDto) {
    return this.productService.findOutOfStock(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un producto con su inventario' })
  @ApiOkResponse({ type: Product })
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  findOne(@Param('id', UuidParamPipe) id: string) {
    return this.productService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Reemplazar todos los datos de un producto' })
  @ApiOkResponse({ type: Product })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un producto con ese nombre',
  })
  replace(
    @Param('id', UuidParamPipe) id: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.productService.replace(id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar parcialmente un producto' })
  @ApiOkResponse({ type: Product })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un producto con ese nombre',
  })
  update(
    @Param('id', UuidParamPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar un producto',
    description:
      'Su inventario se elimina junto con él. Si el producto ya tiene donaciones o entregas, no se puede eliminar.',
  })
  @ApiNoContentResponse({ description: 'Producto eliminado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'El producto tiene donaciones o entregas registradas',
  })
  remove(@Param('id', UuidParamPipe) id: string) {
    return this.productService.remove(id);
  }
}
