import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import {
  buildPaginatedResponse,
  getSkip,
} from '../common/helpers/paginate.helper';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { Donor } from '../donor/entities/donor.entity';
import { InventoryService } from '../inventory/inventory.service';
import { Product } from '../product/entities/product.entity';
import { CreateDonationDto } from './dto/create-donation.dto';
import { Donation } from './entities/donation.entity';

@Injectable()
export class DonationService {
  constructor(
    @InjectRepository(Donation)
    private readonly donationRepository: Repository<Donation>,
    private readonly inventoryService: InventoryService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateDonationDto): Promise<Donation> {
    const donationId = await this.dataSource.transaction(async (manager) => {
      const donor = await manager.findOne(Donor, {
        where: { id: dto.donorId },
      });
      if (!donor) {
        throw new NotFoundException(
          `No se encontró el donante con id ${dto.donorId}`,
        );
      }

      const product = await manager.findOne(Product, {
        where: { id: dto.productId },
      });
      if (!product) {
        throw new NotFoundException(
          `No se encontró el producto con id ${dto.productId}`,
        );
      }

      const donation = await manager.save(
        manager.create(Donation, {
          donor,
          product,
          quantity: dto.quantity,
          notes: dto.notes ?? null,
        }),
      );
      await this.inventoryService.increaseStock(
        manager,
        product.id,
        dto.quantity,
      );
      return donation.id;
    });

    return this.findOne(donationId);
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Donation>> {
    const { page, limit } = query;
    const [data, total] = await this.donationRepository.findAndCount({
      relations: { donor: true, product: true },
      order: { createdAt: 'DESC' },
      skip: getSkip(page, limit),
      take: limit,
    });
    return buildPaginatedResponse(data, total, page, limit);
  }

  async findOne(id: string): Promise<Donation> {
    const donation = await this.donationRepository.findOne({
      where: { id },
      relations: { donor: true, product: true },
    });
    if (!donation) {
      throw new NotFoundException(`No se encontró la donación con id ${id}`);
    }
    return donation;
  }
}
