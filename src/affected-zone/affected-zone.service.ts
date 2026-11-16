import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import {
  buildPaginatedResponse,
  getSkip,
} from '../common/helpers/paginate.helper';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { CreateAffectedZoneDto } from './dto/create-affected-zone.dto';
import { UpdateAffectedZoneDto } from './dto/update-affected-zone.dto';
import { AffectedZone } from './entities/affected-zone.entity';

@Injectable()
export class AffectedZoneService {
  constructor(
    @InjectRepository(AffectedZone)
    private readonly affectedZoneRepository: Repository<AffectedZone>,
  ) {}

  async create(dto: CreateAffectedZoneDto): Promise<AffectedZone> {
    const zone = this.affectedZoneRepository.create(dto);
    return this.affectedZoneRepository.save(zone);
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<AffectedZone>> {
    const { page, limit } = query;
    const [data, total] = await this.affectedZoneRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: getSkip(page, limit),
      take: limit,
    });
    return buildPaginatedResponse(data, total, page, limit);
  }

  async findOne(id: string): Promise<AffectedZone> {
    const zone = await this.affectedZoneRepository.findOne({ where: { id } });
    if (!zone) {
      throw new NotFoundException(
        `No se encontró la zona afectada con id ${id}`,
      );
    }
    return zone;
  }

  async replace(id: string, dto: CreateAffectedZoneDto): Promise<AffectedZone> {
    const zone = await this.findOne(id);
    const { description = null, isActive = true, ...data } = dto;
    Object.assign(zone, data, { description, isActive });
    return this.affectedZoneRepository.save(zone);
  }

  async update(id: string, dto: UpdateAffectedZoneDto): Promise<AffectedZone> {
    const zone = await this.findOne(id);
    const updated = this.affectedZoneRepository.merge(zone, dto);
    return this.affectedZoneRepository.save(updated);
  }

  async remove(id: string): Promise<void> {
    const zone = await this.findOne(id);
    await this.affectedZoneRepository.remove(zone);
  }
}
