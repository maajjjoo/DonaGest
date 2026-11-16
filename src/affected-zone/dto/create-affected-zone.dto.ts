import { Transform } from 'class-transformer';
import { toBoolean } from '../../common/transformers/to-boolean.transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ColombianDepartment } from '../enums/colombian-department.enum';
import { EmergencyType } from '../enums/emergency-type.enum';
import { ZonePriority } from '../enums/zone-priority.enum';

export class CreateAffectedZoneDto {
  @ApiProperty({
    description: 'Nombre de la zona afectada',
    example: 'Vereda Las Flores - San Marcos',
  })
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(150, { message: 'El nombre no puede superar 150 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Departamento de Colombia (o Bogotá D.C.)',
    enum: ColombianDepartment,
    example: ColombianDepartment.SUCRE,
  })
  @IsEnum(ColombianDepartment, {
    message:
      'El departamento debe ser uno de los 32 departamentos de Colombia o Bogotá D.C. (por ejemplo: Sucre, La Guajira, Chocó)',
  })
  department: ColombianDepartment;

  @ApiProperty({ description: 'Municipio', example: 'San Marcos' })
  @IsString({ message: 'El municipio debe ser un texto' })
  @IsNotEmpty({ message: 'El municipio es obligatorio' })
  @MaxLength(100, { message: 'El municipio no puede superar 100 caracteres' })
  municipality: string;

  @ApiProperty({
    description: 'Tipo de emergencia',
    enum: EmergencyType,
    example: EmergencyType.INUNDACION,
  })
  @IsEnum(EmergencyType, {
    message: `El tipo de emergencia debe ser uno de: ${Object.values(EmergencyType).join(', ')}`,
  })
  emergencyType: EmergencyType;

  @ApiProperty({
    description: 'Prioridad de atención',
    enum: ZonePriority,
    example: ZonePriority.CRITICA,
  })
  @IsEnum(ZonePriority, {
    message: `La prioridad debe ser una de: ${Object.values(ZonePriority).join(', ')}`,
  })
  priority: ZonePriority;

  @ApiProperty({ description: 'Número de familias afectadas', example: 320 })
  @IsInt({ message: 'Las familias afectadas deben ser un número entero' })
  @Min(1, { message: 'Debe haber al menos 1 familia afectada' })
  affectedFamilies: number;

  @ApiPropertyOptional({
    description: 'Descripción de la situación',
    example: 'Desbordamiento del río San Jorge que afectó viviendas y cultivos',
  })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Indica si la zona sigue recibiendo ayudas',
    example: true,
    default: true,
  })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean({ message: 'isActive debe ser verdadero o falso' })
  isActive?: boolean;
}
