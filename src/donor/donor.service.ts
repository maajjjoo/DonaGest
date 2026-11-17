import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Not, Repository } from 'typeorm';
import {
  buildPaginatedResponse,
  getSkip,
} from '../common/helpers/paginate.helper';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { CreateDonorDto } from './dto/create-donor.dto';
import { FilterDonorDto } from './dto/filter-donor.dto';
import { Donor } from './entities/donor.entity';

@Injectable()
export class DonorService {
  constructor(
    @InjectRepository(Donor)
    private readonly donorRepository: Repository<Donor>,
  ) {}

  async create(dto: CreateDonorDto): Promise<Donor> {
    await this.ensureUnique(dto.documentNumber, dto.email);
    const donor = this.donorRepository.create(dto);
    return this.donorRepository.save(donor);
  }

  async findAll(query: FilterDonorDto): Promise<PaginatedResponse<Donor>> {
    const { page, limit, search, donorType } = query;
    const base: FindOptionsWhere<Donor> = donorType ? { donorType } : {};
    const where: FindOptionsWhere<Donor>[] | FindOptionsWhere<Donor> = search
      ? [
          { ...base, fullName: ILike(`%${search}%`) },
          { ...base, documentNumber: ILike(`%${search}%`) },
          { ...base, email: ILike(`%${search}%`) },
        ]
      : base;

    const [data, total] = await this.donorRepository.findAndCount({
      where,
      order: { fullName: 'ASC' },
      skip: getSkip(page, limit),
      take: limit,
    });
    return buildPaginatedResponse(data, total, page, limit);
  }

  async findOne(id: string): Promise<Donor> {
    const donor = await this.donorRepository.findOne({ where: { id } });
    if (!donor) {
      throw new NotFoundException(`No se encontró el donante con id ${id}`);
    }
    return donor;
  }

  private async ensureUnique(
    documentNumber?: string,
    email?: string,
    excludeId?: string,
  ): Promise<void> {
    const idCondition = excludeId ? { id: Not(excludeId) } : {};

    if (documentNumber) {
      const byDocument = await this.donorRepository.findOne({
        where: { documentNumber, ...idCondition },
      });
      if (byDocument) {
        throw new ConflictException(
          `Ya existe un donante con el documento ${documentNumber}`,
        );
      }
    }

    if (email) {
      const byEmail = await this.donorRepository.findOne({
        where: { email, ...idCondition },
      });
      if (byEmail) {
        throw new ConflictException(
          `Ya existe un donante con el correo ${email}`,
        );
      }
    }
  }
}
