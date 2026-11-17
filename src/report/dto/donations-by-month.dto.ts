import { ApiProperty } from '@nestjs/swagger';

export class DonationsByMonthDto {
  @ApiProperty({ example: '2026-11', description: 'Mes (AAAA-MM)' })
  month: string;

  @ApiProperty({ example: 12, description: 'Donaciones RECIBIDAS en el mes' })
  receivedDonations: number;

  @ApiProperty({ example: 1, description: 'Donaciones ANULADAS en el mes' })
  cancelledDonations: number;

  @ApiProperty({
    example: 2618,
    description: 'Unidades donadas en el mes (solo recibidas)',
  })
  unitsDonated: number;

  @ApiProperty({ example: 4, description: 'Donantes distintos en el mes' })
  donors: number;
}
