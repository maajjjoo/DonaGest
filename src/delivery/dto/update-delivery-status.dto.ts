import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { DeliveryStatus } from '../enums/delivery-status.enum';

export class UpdateDeliveryStatusDto {
  @ApiProperty({
    description:
      'Nuevo estado. Permitidos: PROGRAMADA → EN_TRANSITO o CANCELADA; EN_TRANSITO → ENTREGADA o CANCELADA',
    enum: DeliveryStatus,
    example: DeliveryStatus.EN_TRANSITO,
  })
  @IsEnum(DeliveryStatus, {
    message: `El estado debe ser uno de: ${Object.values(DeliveryStatus).join(', ')}`,
  })
  status: DeliveryStatus;

  @ApiPropertyOptional({
    description: 'Observación sobre el cambio (reemplaza las notas actuales)',
    example: 'El camión salió de Sincelejo a las 6:00 a. m.',
  })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser un texto' })
  @MaxLength(500, { message: 'Las notas no pueden superar 500 caracteres' })
  notes?: string;
}
