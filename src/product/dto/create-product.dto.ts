import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ProductCategory } from '../enums/product-category.enum';
import { ProductUnit } from '../enums/product-unit.enum';

export class CreateProductDto {
  @ApiProperty({
    description: 'Nombre del producto (no se puede repetir)',
    example: 'Agua potable en bolsa 6 L',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(150, { message: 'El nombre no puede superar 150 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Categoría del producto',
    enum: ProductCategory,
    example: ProductCategory.AGUA,
  })
  @IsEnum(ProductCategory, {
    message: `La categoría debe ser una de: ${Object.values(ProductCategory).join(', ')}`,
  })
  category: ProductCategory;

  @ApiProperty({
    description: 'Unidad de medida',
    enum: ProductUnit,
    example: ProductUnit.PAQUETE,
  })
  @IsEnum(ProductUnit, {
    message: `La unidad debe ser una de: ${Object.values(ProductUnit).join(', ')}`,
  })
  unit: ProductUnit;

  @ApiPropertyOptional({
    description: 'Descripción del producto',
    example: 'Bolsas de agua potable para familias sin acceso a acueducto',
  })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  description?: string;
}
