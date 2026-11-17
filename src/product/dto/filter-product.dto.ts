import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ProductCategory } from '../enums/product-category.enum';

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
}
