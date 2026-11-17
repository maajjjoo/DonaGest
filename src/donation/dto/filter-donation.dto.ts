import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { DonationStatus } from '../enums/donation-status.enum';

export class FilterDonationDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar por donante',
    example: 'd461474b-a2a7-4b5b-bece-5db4afc1f4d0',
  })
  @IsOptional()
  @IsUUID('all', { message: 'donorId debe ser un UUID válido' })
  donorId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por producto',
    example: '7995f153-f381-45e8-8b23-fedf0d0712fe',
  })
  @IsOptional()
  @IsUUID('all', { message: 'productId debe ser un UUID válido' })
  productId?: string;

  @ApiPropertyOptional({
    enum: DonationStatus,
    example: DonationStatus.RECIBIDA,
  })
  @IsOptional()
  @IsEnum(DonationStatus, {
    message: `El estado debe ser uno de: ${Object.values(DonationStatus).join(', ')}`,
  })
  status?: DonationStatus;
}
