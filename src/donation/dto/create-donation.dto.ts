import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateDonationDto {
  @ApiProperty({
    description: 'Id del donante',
    example: 'd461474b-a2a7-4b5b-bece-5db4afc1f4d0',
  })
  @IsUUID('all', { message: 'donorId debe ser un UUID válido' })
  donorId: string;

  @ApiProperty({
    description: 'Id del producto donado',
    example: '7995f153-f381-45e8-8b23-fedf0d0712fe',
  })
  @IsUUID('all', { message: 'productId debe ser un UUID válido' })
  productId: string;

  @ApiProperty({ description: 'Cantidad donada', example: 200 })
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  quantity: number;

  @ApiPropertyOptional({
    description: 'Observaciones de la donación',
    example: 'Entregado en el centro de acopio de la Cruz Roja en Sincelejo',
  })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser un texto' })
  @MaxLength(500, { message: 'Las notas no pueden superar 500 caracteres' })
  notes?: string;
}
