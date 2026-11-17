import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ProductCategory } from '../enums/product-category.enum';
import { ProductSortField, SortOrder } from '../enums/product-sort.enum';

export class FilterProductDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ProductCategory, example: ProductCategory.AGUA })
  @IsOptional()
  @IsEnum(ProductCategory, {
    message: `La categoría debe ser una de: ${Object.values(ProductCategory).join(', ')}`,
  })
  category?: ProductCategory;

  @ApiPropertyOptional({
    description: 'Busca en el nombre o la descripción del producto',
    example: 'agua',
  })
  @IsOptional()
  @IsString({ message: 'La búsqueda debe ser un texto' })
  @MaxLength(100, { message: 'La búsqueda no puede superar 100 caracteres' })
  search?: string;

  @ApiPropertyOptional({
    description:
      'Campo por el que se ordena. Con category se usa el orden de las categorías (ALIMENTOS, AGUA, ASEO, MEDICAMENTOS, ROPA, COBIJAS, OTROS) y dentro de cada una por nombre',
    enum: ProductSortField,
    default: ProductSortField.NAME,
  })
  @IsOptional()
  @IsEnum(ProductSortField, {
    message: `sort debe ser uno de: ${Object.values(ProductSortField).join(', ')}`,
  })
  sort: ProductSortField = ProductSortField.NAME;

  @ApiPropertyOptional({
    description: 'Dirección del orden',
    enum: SortOrder,
    default: SortOrder.ASC,
  })
  @IsOptional()
  @IsEnum(SortOrder, {
    message: `order debe ser uno de: ${Object.values(SortOrder).join(', ')}`,
  })
  order: SortOrder = SortOrder.ASC;
}
