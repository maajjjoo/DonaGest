import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffectedZoneController } from './affected-zone.controller';
import { AffectedZoneService } from './affected-zone.service';
import { AffectedZone } from './entities/affected-zone.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AffectedZone])],
  controllers: [AffectedZoneController],
  providers: [AffectedZoneService],
  exports: [AffectedZoneService],
})
export class AffectedZoneModule {}
