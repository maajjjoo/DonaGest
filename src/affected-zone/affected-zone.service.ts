import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { escapeLike } from '../common/helpers/escape-like.helper';
import {
  buildPaginatedResponse,
  getSkip,
} from '../common/helpers/paginate.helper';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { CreateAffectedZoneDto } from './dto/create-affected-zone.dto';
import { DepartmentStatsDto } from './dto/department-stats.dto';
import { FilterAffectedZoneDto } from './dto/filter-affected-zone.dto';
import { UpdateAffectedZoneDto } from './dto/update-affected-zone.dto';
import { UpdateZoneStatusDto } from './dto/update-zone-status.dto';
import { AffectedZone } from './entities/affected-zone.entity';
import { ColombianDepartment } from './enums/colombian-department.enum';

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
    query: FilterAffectedZoneDto,
  ): Promise<PaginatedResponse<AffectedZone>> {
    const {
      page,
      limit,
      search,
      department,
      priority,
      emergencyType,
      isActive,
    } = query;
    const where: FindOptionsWhere<AffectedZone> = {};
    if (department) where.department = department;
    if (priority) where.priority = priority;
    if (emergencyType) where.emergencyType = emergencyType;
    if (isActive !== undefined) where.isActive = isActive;

    // El enum de prioridad se guarda en orden BAJA -> CRITICA, por eso DESC deja primero las críticas
    const pattern = search ? ILike(`%${escapeLike(search)}%`) : undefined;

    const [data, total] = await this.affectedZoneRepository.findAndCount({
      where: pattern
        ? [
            { ...where, name: pattern },
            { ...where, municipality: pattern },
          ]
        : where,
      order: { priority: 'DESC', affectedFamilies: 'DESC', createdAt: 'DESC' },
      skip: getSkip(page, limit),
      take: limit,
    });
    return buildPaginatedResponse(data, total, page, limit);
  }

  async getStatsByDepartment(): Promise<DepartmentStatsDto[]> {
    const rows = await this.affectedZoneRepository
      .createQueryBuilder('zone')
      .select('zone.department', 'department')
      .addSelect('COUNT(zone.id)', 'zones')
      .addSelect(
        'SUM(CASE WHEN zone.isActive THEN 1 ELSE 0 END)',
        'activeZones',
      )
      .addSelect('SUM(zone.affectedFamilies)', 'affectedFamilies')
      .groupBy('zone.department')
      .orderBy('"affectedFamilies"', 'DESC')
      .getRawMany<{
        department: ColombianDepartment;
        zones: string;
        activeZones: string;
        affectedFamilies: string;
      }>();

    return rows.map((row) => ({
      department: row.department,
      zones: Number(row.zones),
      activeZones: Number(row.activeZones),
      affectedFamilies: Number(row.affectedFamilies),
    }));
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

  async updateStatus(
    id: string,
    dto: UpdateZoneStatusDto,
  ): Promise<AffectedZone> {
    const zone = await this.findOne(id);
    zone.isActive = dto.isActive;
    return this.affectedZoneRepository.save(zone);
  }

  async remove(id: string): Promise<void> {
    const zone = await this.findOne(id);
    await this.affectedZoneRepository.remove(zone);
  }
}
