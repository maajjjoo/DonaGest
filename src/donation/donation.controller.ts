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
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UuidParamPipe } from '../common/pipes/uuid-param.pipe';
import { DonationService } from './donation.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { Donation } from './entities/donation.entity';

@ApiTags('Donaciones')
@Controller('donations')
export class DonationController {
  constructor(private readonly donationService: DonationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una donación',
    description:
      'Guarda la donación y suma la cantidad al inventario del producto en la misma transacción. Las donaciones no se eliminan para no perder el historial; si hubo un error se deben anular.',
  })
  @ApiCreatedResponse({ description: 'Donación registrada', type: Donation })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({
    status: 404,
    description: 'No existe el donante o el producto',
  })
  create(@Body() dto: CreateDonationDto) {
    return this.donationService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar donaciones, las más recientes primero' })
  @ApiPaginatedResponse(Donation)
  findAll(@Query() query: PaginationQueryDto) {
    return this.donationService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar una donación por su id' })
  @ApiOkResponse({ type: Donation })
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido' })
  @ApiResponse({ status: 404, description: 'Donación no encontrada' })
  findOne(@Param('id', UuidParamPipe) id: string) {
    return this.donationService.findOne(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Anular una donación',
    description:
      'Solo se pueden anular donaciones RECIBIDAS. La cantidad se descuenta del inventario en la misma transacción; si ese stock ya se entregó, no se puede anular. Se anula en vez de borrar para conservar el historial.',
  })
  @ApiOkResponse({ type: Donation })
  @ApiResponse({ status: 400, description: 'La donación ya estaba anulada' })
  @ApiResponse({ status: 404, description: 'Donación no encontrada' })
  @ApiResponse({
    status: 409,
    description: 'Stock insuficiente para descontar la donación',
  })
  cancel(@Param('id', UuidParamPipe) id: string) {
    return this.donationService.cancel(id);
  }
}
