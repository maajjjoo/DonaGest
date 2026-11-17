import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  NotEquals,
} from 'class-validator';

export class AdjustInventoryDto {
  @ApiProperty({
    description:
      'Cantidad a sumar (positiva) o a descontar (negativa) del inventario',
    example: -12,
  })
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @NotEquals(0, { message: 'La cantidad no puede ser 0' })
  @Min(-100000, { message: 'La cantidad no puede ser menor a -100000' })
  @Max(100000, { message: 'La cantidad no puede ser mayor a 100000' })
  quantity: number;

  @ApiProperty({
    description: 'Motivo del ajuste',
    example: 'Producto vencido',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'El motivo debe ser un texto' })
  @IsNotEmpty({ message: 'El motivo del ajuste es obligatorio' })
  @MinLength(5, { message: 'El motivo debe tener al menos 5 caracteres' })
  @MaxLength(255, { message: 'El motivo no puede superar 255 caracteres' })
  reason: string;
}
