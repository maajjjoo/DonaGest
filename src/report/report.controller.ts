import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UuidParamPipe } from '../common/pipes/uuid-param.pipe';
import { SummaryReportDto } from './dto/summary-report.dto';
import { InventoryByCategoryDto } from './dto/inventory-by-category.dto';
import { TopDonorDto } from './dto/top-donor.dto';
import { ZoneReportDto } from './dto/zone-report.dto';
import { AffectedZone } from '../affected-zone/entities/affected-zone.entity';
import { ReportService } from './report.service';

@ApiTags('Reportes')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Resumen general de la operación humanitaria',
    description:
      'Totales de donantes, donaciones recibidas y anuladas, unidades donadas, entregas por estado, zonas activas por prioridad y productos en alerta de stock.',
  })
  @ApiOkResponse({ type: SummaryReportDto })
  getSummary() {
    return this.reportService.getSummary();
  }

  @Get('top-donors')
  @ApiOperation({
    summary: 'Los 5 donantes con más unidades donadas',
    description: 'Solo cuenta donaciones RECIBIDAS (no las anuladas).',
  })
  @ApiOkResponse({ type: TopDonorDto, isArray: true })
  getTopDonors() {
    return this.reportService.getTopDonors();
  }

  @Get('inventory-by-category')
  @ApiOperation({
    summary: 'Unidades disponibles por categoría de producto',
    description:
      'Incluye todas las categorías, aunque no tengan productos, y cuántos productos de cada una están en alerta.',
  })
  @ApiOkResponse({ type: InventoryByCategoryDto, isArray: true })
  getInventoryByCategory() {
    return this.reportService.getInventoryByCategory();
  }

  @Get('zones-without-deliveries')
  @ApiOperation({
    summary: 'Zonas activas que todavía no tienen entregas',
    description:
      'Las entregas canceladas no cuentan. Se ordenan de prioridad CRITICA a BAJA y luego por familias afectadas, para saber a dónde enviar ayuda primero.',
  })
  @ApiOkResponse({ type: AffectedZone, isArray: true })
  getZonesWithoutDeliveries() {
    return this.reportService.getZonesWithoutDeliveries();
  }

  @Get('zones/:id')
  @ApiOperation({
    summary: 'Resumen de una zona afectada',
    description:
      'Entregas de la zona por estado y unidades ya entregadas por producto.',
  })
  @ApiOkResponse({ type: ZoneReportDto })
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido' })
  @ApiResponse({ status: 404, description: 'Zona no encontrada' })
  getZoneReport(@Param('id', UuidParamPipe) id: string) {
    return this.reportService.getZoneReport(id);
  }
}
