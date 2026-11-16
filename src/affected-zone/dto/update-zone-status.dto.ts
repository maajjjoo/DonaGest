import { Transform } from 'class-transformer';
import { toBoolean } from '../../common/transformers/to-boolean.transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateZoneStatusDto {
  @ApiProperty({
    description:
      'true para activar la zona (recibe entregas) o false para desactivarla',
    example: false,
  })
  @Transform(toBoolean)
  @IsBoolean({ message: 'isActive debe ser true o false' })
  isActive: boolean;
}
