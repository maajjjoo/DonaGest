import { ApiProperty } from '@nestjs/swagger';
import { DonorType } from '../../donor/enums/donor-type.enum';

export class TopDonorDto {
  @ApiProperty({ example: 'd461474b-a2a7-4b5b-bece-5db4afc1f4d0' })
  donorId: string;

  @ApiProperty({ example: 'Fundación Bolívar Davivienda' })
  fullName: string;

  @ApiProperty({ enum: DonorType, example: DonorType.FUNDACION })
  donorType: DonorType;

  @ApiProperty({ example: 'Bogotá' })
  city: string;

  @ApiProperty({ example: 2500, description: 'Unidades donadas (recibidas)' })
  unitsDonated: number;

  @ApiProperty({ example: 6, description: 'Cantidad de donaciones recibidas' })
  donationsCount: number;
}
