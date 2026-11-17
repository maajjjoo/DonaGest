import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffectedZone } from '../affected-zone/entities/affected-zone.entity';
import { Delivery } from '../delivery/entities/delivery.entity';
import { Donation } from '../donation/entities/donation.entity';
import { Donor } from '../donor/entities/donor.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Donor,
      Donation,
      Delivery,
      AffectedZone,
      Inventory,
    ]),
  ],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
