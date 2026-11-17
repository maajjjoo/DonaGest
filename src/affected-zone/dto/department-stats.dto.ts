import { ApiProperty } from '@nestjs/swagger';
import { ColombianDepartment } from '../enums/colombian-department.enum';

export class DepartmentStatsDto {
  @ApiProperty({
    enum: ColombianDepartment,
    example: ColombianDepartment.SUCRE,
  })
  department: ColombianDepartment;

  @ApiProperty({ example: 3, description: 'Zonas registradas' })
  zones: number;

  @ApiProperty({ example: 2, description: 'Zonas activas' })
  activeZones: number;

  @ApiProperty({
    example: 1640,
    description: 'Familias afectadas sumando todas las zonas',
  })
  affectedFamilies: number;
}
