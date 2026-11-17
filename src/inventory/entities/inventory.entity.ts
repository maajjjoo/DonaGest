import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../product/entities/product.entity';

@Entity({ name: 'inventories' })
export class Inventory {
  @ApiProperty({ example: '9a7e4d2c-1b3f-4e5a-8c6d-7f8e9a0b1c2d' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiPropertyOptional({ type: () => Product })
  @OneToOne(() => Product, (product) => product.inventory, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ApiProperty({ example: 150, description: 'Cantidad disponible' })
  @Column({ type: 'int', default: 0, name: 'available_quantity' })
  availableQuantity: number;

  @ApiProperty({
    example: 10,
    description: 'Cantidad mínima antes de generar una alerta',
  })
  @Column({ type: 'int', default: 10, name: 'minimum_stock' })
  minimumStock: number;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
