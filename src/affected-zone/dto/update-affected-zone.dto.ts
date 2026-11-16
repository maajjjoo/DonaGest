import { PartialType } from '@nestjs/swagger';
import { CreateAffectedZoneDto } from './create-affected-zone.dto';

export class UpdateAffectedZoneDto extends PartialType(CreateAffectedZoneDto) {}
