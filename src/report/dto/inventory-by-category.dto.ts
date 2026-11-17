import { ApiProperty } from '@nestjs/swagger';
import { ProductCategory } from '../../product/enums/product-category.enum';

export class InventoryByCategoryDto {
  @ApiProperty({ enum: ProductCategory, example: ProductCategory.AGUA })
  category: ProductCategory;

  @ApiProperty({ example: 3, description: 'Productos de la categoría' })
  productsCount: number;

  @ApiProperty({ example: 1450, description: 'Unidades disponibles' })
  availableUnits: number;

  @ApiProperty({
    example: 1,
    description: 'Productos de la categoría en alerta de stock',
  })
  productsInAlert: number;
}
