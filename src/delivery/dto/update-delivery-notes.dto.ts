import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength } from 'class-validator';

export class UpdateDeliveryNotesDto {
  @ApiProperty({
    description:
      'Nuevas observaciones de la entrega. Enviar "" para borrarlas.',
    example: 'La vía a San Marcos está cerrada; se usará la ruta por Majagual',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Las notas deben ser un texto' })
  @MaxLength(500, { message: 'Las notas no pueden superar 500 caracteres' })
  notes: string;
}
