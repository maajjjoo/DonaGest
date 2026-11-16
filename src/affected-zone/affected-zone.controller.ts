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
import { AffectedZoneService } from './affected-zone.service';
import { CreateAffectedZoneDto } from './dto/create-affected-zone.dto';
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
  @ApiOperation({ summary: 'Listar zonas afectadas con paginación' })
  @ApiPaginatedResponse(AffectedZone)
  findAll(@Query() query: PaginationQueryDto) {
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
}
