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
import { Donor } from '../../donor/entities/donor.entity';
import { Product } from '../../product/entities/product.entity';
import { DonationStatus } from '../enums/donation-status.enum';

@Entity({ name: 'donations' })
export class Donation {
  @ApiProperty({ example: 'b7c8d9e0-f1a2-4b3c-8d4e-5f6a7b8c9d0e' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => Donor })
  @ManyToOne(() => Donor, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'donor_id' })
  donor: Donor;

  @ApiProperty({ type: () => Product })
  @ManyToOne(() => Product, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ApiProperty({ example: 200 })
  @Column({ type: 'int' })
  quantity: number;

  @ApiProperty({ enum: DonationStatus, example: DonationStatus.RECIBIDA })
  @Column({
    type: 'enum',
    enum: DonationStatus,
    default: DonationStatus.RECIBIDA,
  })
  status: DonationStatus;

  @ApiPropertyOptional({
    example: 'Entregado en el centro de acopio de la Cruz Roja en Sincelejo',
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
