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
import { UuidParamPipe } from '../common/pipes/uuid-param.pipe';
import { DonorService } from './donor.service';
import { CreateDonorDto } from './dto/create-donor.dto';
import { FilterDonorDto } from './dto/filter-donor.dto';
import { UpdateDonorDto } from './dto/update-donor.dto';
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

  @Put(':id')
  @ApiOperation({ summary: 'Reemplazar todos los datos de un donante' })
  @ApiOkResponse({ type: Donor })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Donante no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'El documento o el correo ya pertenecen a otro donante',
  })
  replace(@Param('id', UuidParamPipe) id: string, @Body() dto: CreateDonorDto) {
    return this.donorService.replace(id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar parcialmente un donante' })
  @ApiOkResponse({ type: Donor })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Donante no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'El documento o el correo ya pertenecen a otro donante',
  })
  update(@Param('id', UuidParamPipe) id: string, @Body() dto: UpdateDonorDto) {
    return this.donorService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un donante' })
  @ApiNoContentResponse({ description: 'Donante eliminado' })
  @ApiResponse({ status: 404, description: 'Donante no encontrado' })
  @ApiResponse({
    status: 409,
    description:
      'El donante tiene donaciones registradas y no se puede eliminar',
  })
  remove(@Param('id', UuidParamPipe) id: string) {
    return this.donorService.remove(id);
  }
}
