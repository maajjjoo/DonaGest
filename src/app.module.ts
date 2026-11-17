import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { AffectedZoneModule } from './affected-zone/affected-zone.module';
import { DonorModule } from './donor/donor.module';
import { ProductModule } from './product/product.module';
import { InventoryModule } from './inventory/inventory.module';
import { DonationModule } from './donation/donation.module';
import { DeliveryModule } from './delivery/delivery.module';

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
    InventoryModule,
    DonationModule,
    DeliveryModule,
  ],
})
export class AppModule {}
