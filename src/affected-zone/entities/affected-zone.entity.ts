import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EmergencyType } from '../enums/emergency-type.enum';
import { ZonePriority } from '../enums/zone-priority.enum';

@Entity({ name: 'affected_zones' })
export class AffectedZone {
  @ApiProperty({ example: '6f1c2b8e-3d4a-4c9b-9f0e-1a2b3c4d5e6f' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Vereda Las Flores - San Marcos' })
  @Column({ type: 'varchar', length: 150 })
  name: string;

  @ApiProperty({ example: 'Sucre' })
  @Column({ type: 'varchar', length: 100 })
  department: string;

  @ApiProperty({ example: 'San Marcos' })
  @Column({ type: 'varchar', length: 100 })
  municipality: string;

  @ApiProperty({ enum: EmergencyType, example: EmergencyType.INUNDACION })
  @Column({ type: 'enum', enum: EmergencyType, name: 'emergency_type' })
  emergencyType: EmergencyType;

  @ApiProperty({ enum: ZonePriority, example: ZonePriority.CRITICA })
  @Column({ type: 'enum', enum: ZonePriority })
  priority: ZonePriority;

  @ApiProperty({ example: 320 })
  @Column({ type: 'int', name: 'affected_families' })
  affectedFamilies: number;

  @ApiPropertyOptional({
    example: 'Desbordamiento del río San Jorge que afectó viviendas y cultivos',
  })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ example: true })
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
