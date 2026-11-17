import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DocumentType } from '../enums/document-type.enum';
import { DonorType } from '../enums/donor-type.enum';

@Entity({ name: 'donors' })
export class Donor {
  @ApiProperty({ example: '3b0f7c1e-8a52-4f0e-9d7b-2c1a4e5f6a7b' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'María Fernanda Ospina Restrepo' })
  @Column({ type: 'varchar', length: 150, name: 'full_name' })
  fullName: string;

  @ApiProperty({ enum: DocumentType, example: DocumentType.CC })
  @Column({ type: 'enum', enum: DocumentType, name: 'document_type' })
  documentType: DocumentType;

  @ApiProperty({ example: '1020456789' })
  @Column({
    type: 'varchar',
    length: 20,
    unique: true,
    name: 'document_number',
  })
  documentNumber: string;

  @ApiProperty({ example: 'maria.ospina@gmail.com' })
  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @ApiProperty({ example: '3104567890' })
  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @ApiProperty({ example: 'Medellín' })
  @Column({ type: 'varchar', length: 100 })
  city: string;

  @ApiProperty({ enum: DonorType, example: DonorType.PERSONA_NATURAL })
  @Column({ type: 'enum', enum: DonorType, name: 'donor_type' })
  donorType: DonorType;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
