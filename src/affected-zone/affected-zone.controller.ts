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
import { AffectedZoneService } from './affected-zone.service';
import { CreateAffectedZoneDto } from './dto/create-affected-zone.dto';
import { FilterAffectedZoneDto } from './dto/filter-affected-zone.dto';
import { UpdateAffectedZoneDto } from './dto/update-affected-zone.dto';
import { AffectedZone } from './entities/affected-zone.entity';

@ApiTags('Zonas afectadas')
@Controller('affected-zones')
export class AffectedZoneController {
  constructor(private readonly affectedZoneService: AffectedZoneService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar una zona afectada por una emergencia' })
  @ApiCreatedResponse({ description: 'Zona registrada', type: AffectedZone })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(@Body() dto: CreateAffectedZoneDto) {
    return this.affectedZoneService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'Listar zonas afectadas con filtros, ordenadas de prioridad CRITICA a BAJA',
  })
  @ApiPaginatedResponse(AffectedZone)
  findAll(@Query() query: FilterAffectedZoneDto) {
    return this.affectedZoneService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar una zona afectada por su id' })
  @ApiOkResponse({ type: AffectedZone })
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido' })
  @ApiResponse({ status: 404, description: 'Zona no encontrada' })
  findOne(@Param('id', UuidParamPipe) id: string) {
    return this.affectedZoneService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Reemplazar todos los datos de una zona afectada',
  })
  @ApiOkResponse({ type: AffectedZone })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Zona no encontrada' })
  replace(
    @Param('id', UuidParamPipe) id: string,
    @Body() dto: CreateAffectedZoneDto,
  ) {
    return this.affectedZoneService.replace(id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar parcialmente una zona afectada' })
  @ApiOkResponse({ type: AffectedZone })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Zona no encontrada' })
  update(
    @Param('id', UuidParamPipe) id: string,
    @Body() dto: UpdateAffectedZoneDto,
  ) {
    return this.affectedZoneService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una zona afectada' })
  @ApiNoContentResponse({ description: 'Zona eliminada' })
  @ApiResponse({ status: 404, description: 'Zona no encontrada' })
  @ApiResponse({
    status: 409,
    description: 'La zona tiene entregas registradas y no se puede eliminar',
  })
  remove(@Param('id', UuidParamPipe) id: string) {
    return this.affectedZoneService.remove(id);
  }
}
