import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonorModule } from '../donor/donor.module';
import { InventoryModule } from '../inventory/inventory.module';
import { DonationController } from './donation.controller';
import { DonationService } from './donation.service';
import { DonorDonationsController } from './donor-donations.controller';
import { Donation } from './entities/donation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Donation]), InventoryModule, DonorModule],
  controllers: [DonationController, DonorDonationsController],
  providers: [DonationService],
  exports: [DonationService],
})
export class DonationModule {}
