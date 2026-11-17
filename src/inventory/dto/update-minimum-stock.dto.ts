import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class UpdateMinimumStockDto {
  @ApiProperty({
    description: 'Cantidad mínima antes de generar una alerta de stock',
    example: 50,
  })
  @IsInt({ message: 'El stock mínimo debe ser un número entero' })
  @Min(0, { message: 'El stock mínimo no puede ser negativo' })
  @Max(100000, { message: 'El stock mínimo no puede superar 100000' })
  minimumStock: number;
}
