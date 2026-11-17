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
import { UuidParamPipe } from '../common/pipes/uuid-param.pipe';
import { DonorService } from './donor.service';
import { CreateDonorDto } from './dto/create-donor.dto';
import { FilterDonorDto } from './dto/filter-donor.dto';
import { Donor } from './entities/donor.entity';

@ApiTags('Donantes')
@Controller('donors')
export class DonorController {
  constructor(private readonly donorService: DonorService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un donante' })
  @ApiCreatedResponse({ description: 'Donante registrado', type: Donor })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un donante con ese documento o correo',
  })
  create(@Body() dto: CreateDonorDto) {
    return this.donorService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar donantes con búsqueda y filtro por tipo de donante',
  })
  @ApiPaginatedResponse(Donor)
  findAll(@Query() query: FilterDonorDto) {
    return this.donorService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un donante por su id' })
  @ApiOkResponse({ type: Donor })
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido' })
  @ApiResponse({ status: 404, description: 'Donante no encontrado' })
  findOne(@Param('id', UuidParamPipe) id: string) {
    return this.donorService.findOne(id);
  }
}
