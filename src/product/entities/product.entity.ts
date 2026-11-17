import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Inventory } from '../../inventory/entities/inventory.entity';
import { ProductCategory } from '../enums/product-category.enum';
import { ProductUnit } from '../enums/product-unit.enum';

@Entity({ name: 'products' })
export class Product {
  @ApiProperty({ example: '5c2e8f1a-6b4d-4a9e-9c3f-0d1e2f3a4b5c' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Agua potable en bolsa 6 L' })
  @Column({ type: 'varchar', length: 150, unique: true })
  name: string;

  @ApiProperty({ enum: ProductCategory, example: ProductCategory.AGUA })
  @Column({ type: 'enum', enum: ProductCategory })
  category: ProductCategory;

  @ApiProperty({ enum: ProductUnit, example: ProductUnit.PAQUETE })
  @Column({ type: 'enum', enum: ProductUnit })
  unit: ProductUnit;

  @ApiPropertyOptional({
    example: 'Bolsas de agua potable para familias sin acceso a acueducto',
  })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiPropertyOptional({ type: () => Inventory })
  @OneToOne(() => Inventory, (inventory) => inventory.product, {
    cascade: ['insert'],
  })
  inventory: Inventory;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
