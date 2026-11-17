import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UuidParamPipe } from '../common/pipes/uuid-param.pipe';
import { DonationService } from './donation.service';
import { Donation } from './entities/donation.entity';

@ApiTags('Donantes')
@Controller('donors')
export class DonorDonationsController {
  constructor(private readonly donationService: DonationService) {}

  @Get(':id/donations')
  @ApiOperation({
    summary: 'Historial de donaciones de un donante',
    description: 'Incluye las donaciones recibidas y las anuladas.',
  })
  @ApiPaginatedResponse(Donation)
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido' })
  @ApiResponse({ status: 404, description: 'Donante no encontrado' })
  findByDonor(
    @Param('id', UuidParamPipe) id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.donationService.findByDonor(id, query);
  }
}
