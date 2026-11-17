import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffectedZoneModule } from '../affected-zone/affected-zone.module';
import { InventoryModule } from '../inventory/inventory.module';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import { Delivery } from './entities/delivery.entity';
import { ZoneDeliveriesController } from './zone-deliveries.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Delivery]),
    InventoryModule,
    AffectedZoneModule,
  ],
  controllers: [DeliveryController, ZoneDeliveriesController],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
