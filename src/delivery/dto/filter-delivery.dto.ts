import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { DeliveryStatus } from '../enums/delivery-status.enum';

export class FilterDeliveryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar por zona afectada',
    example: '6ecc943e-27a6-4651-9098-c69ce5341318',
  })
  @IsOptional()
  @IsUUID('all', { message: 'affectedZoneId debe ser un UUID válido' })
  affectedZoneId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por producto',
    example: '7995f153-f381-45e8-8b23-fedf0d0712fe',
  })
  @IsOptional()
  @IsUUID('all', { message: 'productId debe ser un UUID válido' })
  productId?: string;

  @ApiPropertyOptional({
    enum: DeliveryStatus,
    example: DeliveryStatus.PROGRAMADA,
  })
  @IsOptional()
  @IsEnum(DeliveryStatus, {
    message: `El estado debe ser uno de: ${Object.values(DeliveryStatus).join(', ')}`,
  })
  status?: DeliveryStatus;

  @ApiPropertyOptional({
    description: 'Fecha programada desde (AAAA-MM-DD)',
    example: '2026-11-01',
  })
  @IsOptional()
  @IsDateString(
    { strict: true },
    { message: 'from debe ser una fecha válida con formato AAAA-MM-DD' },
  )
  from?: string;

  @ApiPropertyOptional({
    description: 'Fecha programada hasta (AAAA-MM-DD)',
    example: '2026-11-30',
  })
  @IsOptional()
  @IsDateString(
    { strict: true },
    { message: 'to debe ser una fecha válida con formato AAAA-MM-DD' },
  )
  to?: string;
}
