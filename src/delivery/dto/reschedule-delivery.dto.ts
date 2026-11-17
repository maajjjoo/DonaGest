import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class RescheduleDeliveryDto {
  @ApiProperty({
    description:
      'Nueva fecha programada (AAAA-MM-DD). No puede estar en el pasado.',
    example: '2026-11-25',
  })
  @IsDateString(
    { strict: true },
    {
      message: 'scheduledDate debe ser una fecha válida con formato AAAA-MM-DD',
    },
  )
  scheduledDate: string;
}
