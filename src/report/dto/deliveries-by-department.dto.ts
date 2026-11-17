import { ApiProperty } from '@nestjs/swagger';
import { ColombianDepartment } from '../../affected-zone/enums/colombian-department.enum';

export class DeliveriesByDepartmentDto {
  @ApiProperty({
    enum: ColombianDepartment,
    example: ColombianDepartment.SUCRE,
  })
  department: ColombianDepartment;

  @ApiProperty({ example: 6, description: 'Entregas registradas' })
  totalDeliveries: number;

  @ApiProperty({
    example: 2,
    description: 'Entregas pendientes (PROGRAMADA o EN_TRANSITO)',
  })
  pendingDeliveries: number;

  @ApiProperty({ example: 3, description: 'Entregas ENTREGADAS' })
  completedDeliveries: number;

  @ApiProperty({ example: 1, description: 'Entregas CANCELADAS' })
  cancelledDeliveries: number;

  @ApiProperty({
    example: 540,
    description: 'Unidades entregadas (solo entregas ENTREGADAS)',
  })
  unitsDelivered: number;
}
