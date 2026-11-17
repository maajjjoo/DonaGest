import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AffectedZone } from '../../affected-zone/entities/affected-zone.entity';
import { Product } from '../../product/entities/product.entity';
import { DeliveryStatus } from '../enums/delivery-status.enum';

@Entity({ name: 'deliveries' })
export class Delivery {
  @ApiProperty({ example: 'e4f5a6b7-c8d9-4e0f-a1b2-c3d4e5f6a7b8' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => AffectedZone })
  @ManyToOne(() => AffectedZone, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'affected_zone_id' })
  affectedZone: AffectedZone;

  @ApiProperty({ type: () => Product })
  @ManyToOne(() => Product, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ApiProperty({ example: 120 })
  @Column({ type: 'int' })
  quantity: number;

  @ApiProperty({ enum: DeliveryStatus, example: DeliveryStatus.PROGRAMADA })
  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.PROGRAMADA,
  })
  status: DeliveryStatus;

  @ApiProperty({ example: '2026-11-20', description: 'Fecha programada' })
  @Column({ type: 'date', name: 'scheduled_date' })
  scheduledDate: string;

  @ApiPropertyOptional({
    example: '2026-11-20T15:30:00.000Z',
    nullable: true,
    description: 'Fecha y hora en que se marcó como ENTREGADA',
  })
  @Column({ type: 'timestamptz', name: 'delivered_at', nullable: true })
  deliveredAt: Date | null;

  @ApiPropertyOptional({
    example: 'Entrega coordinada con la Defensa Civil en el coliseo municipal',
  })
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
