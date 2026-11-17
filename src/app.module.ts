import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { AffectedZoneModule } from './affected-zone/affected-zone.module';
import { DonorModule } from './donor/donor.module';
import { ProductModule } from './product/product.module';
import { DonationController } from './donation/donation.controller';
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
    DonorModule,
    ProductModule,
  ],
  controllers: [DonationController, InventoryController, DeliveryController],
})
export class AppModule {}
