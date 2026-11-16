import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { toBoolean } from '../../common/transformers/to-boolean.transformer';
import { EmergencyType } from '../enums/emergency-type.enum';
import { ZonePriority } from '../enums/zone-priority.enum';

export class FilterAffectedZoneDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Departamento', example: 'Sucre' })
  @IsOptional()
  @IsString({ message: 'El departamento debe ser un texto' })
  department?: string;

  @ApiPropertyOptional({ enum: ZonePriority, example: ZonePriority.CRITICA })
  @IsOptional()
  @IsEnum(ZonePriority, {
    message: `La prioridad debe ser una de: ${Object.values(ZonePriority).join(', ')}`,
  })
  priority?: ZonePriority;

  @ApiPropertyOptional({
    enum: EmergencyType,
    example: EmergencyType.INUNDACION,
  })
  @IsOptional()
  @IsEnum(EmergencyType, {
    message: `El tipo de emergencia debe ser uno de: ${Object.values(EmergencyType).join(', ')}`,
  })
  emergencyType?: EmergencyType;

  @ApiPropertyOptional({
    description: 'Filtrar por zonas activas o inactivas',
    example: true,
  })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean({ message: 'isActive debe ser true o false' })
  isActive?: boolean;
}
