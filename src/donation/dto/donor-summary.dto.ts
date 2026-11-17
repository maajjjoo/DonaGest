import { ApiProperty } from '@nestjs/swagger';

export class DonorSummaryDto {
  @ApiProperty({ example: 'd461474b-a2a7-4b5b-bece-5db4afc1f4d0' })
  donorId: string;

  @ApiProperty({ example: 'María Fernanda Ospina Restrepo' })
  fullName: string;

  @ApiProperty({ example: 5, description: 'Donaciones registradas en total' })
  totalDonations: number;

  @ApiProperty({ example: 4, description: 'Donaciones RECIBIDAS' })
  receivedDonations: number;

  @ApiProperty({ example: 1, description: 'Donaciones ANULADAS' })
  cancelledDonations: number;

  @ApiProperty({
    example: 860,
    description: 'Unidades donadas (solo donaciones recibidas)',
  })
  unitsDonated: number;

  @ApiProperty({
    example: 3,
    description: 'Productos distintos que ha donado (recibidas)',
  })
  productsDonated: number;

  @ApiProperty({
    example: '2026-11-17T14:00:00.000Z',
    nullable: true,
    description: 'Fecha de la última donación recibida',
  })
  lastDonationAt: Date | null;
}
