import { ApiProperty } from '@nestjs/swagger';
import { ProductCategory } from '../../product/enums/product-category.enum';
import { ProductUnit } from '../../product/enums/product-unit.enum';

export class DonationSummaryItemDto {
  @ApiProperty({ example: '7995f153-f381-45e8-8b23-fedf0d0712fe' })
  productId: string;

  @ApiProperty({ example: 'Agua potable en bolsa 6 L' })
  productName: string;

  @ApiProperty({ enum: ProductCategory, example: ProductCategory.AGUA })
  category: ProductCategory;

  @ApiProperty({ enum: ProductUnit, example: ProductUnit.PAQUETE })
  unit: ProductUnit;

  @ApiProperty({ example: 1250, description: 'Unidades donadas en total' })
  totalQuantity: number;

  @ApiProperty({ example: 8, description: 'Cantidad de donaciones' })
  donationsCount: number;
}
