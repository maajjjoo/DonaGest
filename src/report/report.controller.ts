import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SummaryReportDto } from './dto/summary-report.dto';
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
}
