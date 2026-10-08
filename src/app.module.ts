import { Module } from '@nestjs/common';
import { DonorController } from './donor/donor.controller';
import { DonationController } from './donation/donation.controller';
import { ProductController } from './product/product.controller';
import { InventoryController } from './inventory/inventory.controller';
import { AffectedZoneController } from './affected-zone/affected-zone.controller';
import { DeliveryController } from './delivery/delivery.controller';

@Module({
  controllers: [
    DonorController,
    DonationController,
    ProductController,
    InventoryController,
    AffectedZoneController,
    DeliveryController,
  ],
})
export class AppModule {}
