import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryModule } from '../inventory/inventory.module';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import { Delivery } from './entities/delivery.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Delivery]), InventoryModule],
  controllers: [DeliveryController],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
