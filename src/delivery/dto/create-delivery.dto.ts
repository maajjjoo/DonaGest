import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateDeliveryDto {
  @ApiProperty({
    description: 'Id de la zona afectada que recibe la entrega',
    example: '6ecc943e-27a6-4651-9098-c69ce5341318',
  })
  @IsUUID('all', { message: 'affectedZoneId debe ser un UUID válido' })
  affectedZoneId: string;

  @ApiProperty({
    description: 'Id del producto a entregar',
    example: '7995f153-f381-45e8-8b23-fedf0d0712fe',
  })
  @IsUUID('all', { message: 'productId debe ser un UUID válido' })
  productId: string;

  @ApiProperty({ description: 'Cantidad a entregar', example: 120 })
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  quantity: number;

  @ApiProperty({
    description: 'Fecha programada de la entrega (AAAA-MM-DD)',
    example: '2026-11-20',
  })
  @IsDateString(
    { strict: true },
    {
      message: 'scheduledDate debe ser una fecha válida con formato AAAA-MM-DD',
    },
  )
  scheduledDate: string;

  @ApiPropertyOptional({
    description: 'Observaciones de la entrega',
    example: 'Entrega coordinada con la Defensa Civil en el coliseo municipal',
  })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser un texto' })
  @MaxLength(500, { message: 'Las notas no pueden superar 500 caracteres' })
  notes?: string;
}
