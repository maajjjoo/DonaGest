import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { AffectedZoneModule } from './affected-zone/affected-zone.module';
import { DonorController } from './donor/donor.controller';
import { DonationController } from './donation/donation.controller';
import { ProductController } from './product/product.controller';
import { InventoryController } from './inventory/inventory.controller';
import { DeliveryController } from './delivery/delivery.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: databaseConfig,
    }),
    AffectedZoneModule,
  ],
  controllers: [
    DonorController,
    DonationController,
    ProductController,
    InventoryController,
    DeliveryController,
  ],
})
export class AppModule {}
