import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ProductCategory } from '../../product/enums/product-category.enum';

export class FilterAlertsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Mostrar solo las alertas de una categoría',
    enum: ProductCategory,
    example: ProductCategory.AGUA,
  })
  @IsOptional()
  @IsEnum(ProductCategory, {
    message: `La categoría debe ser una de: ${Object.values(ProductCategory).join(', ')}`,
  })
  category?: ProductCategory;
}
