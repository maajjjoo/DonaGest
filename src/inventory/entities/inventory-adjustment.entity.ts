import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Inventory } from './inventory.entity';

@Entity({ name: 'inventory_adjustments' })
export class InventoryAdjustment {
  @ApiProperty({ example: 'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Inventory, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'inventory_id' })
  inventory: Inventory;

  @ApiProperty({
    example: -12,
    description: 'Cantidad sumada (positiva) o descontada (negativa)',
  })
  @Column({ type: 'int' })
  quantity: number;

  @ApiProperty({ example: 50 })
  @Column({ type: 'int', name: 'previous_quantity' })
  previousQuantity: number;

  @ApiProperty({ example: 38 })
  @Column({ type: 'int', name: 'new_quantity' })
  newQuantity: number;

  @ApiProperty({ example: 'Producto vencido' })
  @Column({ type: 'varchar', length: 255 })
  reason: string;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
