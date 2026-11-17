import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import {
  buildPaginatedResponse,
  getSkip,
} from '../common/helpers/paginate.helper';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { DonorService } from '../donor/donor.service';
import { Donor } from '../donor/entities/donor.entity';
import { InventoryService } from '../inventory/inventory.service';
import { Product } from '../product/entities/product.entity';
import { CreateDonationDto } from './dto/create-donation.dto';
import { DonationSummaryItemDto } from './dto/donation-summary.dto';
import { FilterDonationDto } from './dto/filter-donation.dto';
import { Donation } from './entities/donation.entity';
import { DonationStatus } from './enums/donation-status.enum';

@Injectable()
export class DonationService {
  constructor(
    @InjectRepository(Donation)
    private readonly donationRepository: Repository<Donation>,
    private readonly inventoryService: InventoryService,
    private readonly donorService: DonorService,
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

  async cancel(id: string): Promise<Donation> {
    await this.dataSource.transaction(async (manager) => {
      const donation = await manager.findOne(Donation, {
        where: { id },
        relations: { product: true },
        lock: { mode: 'pessimistic_write', tables: ['donations'] },
      });
      if (!donation) {
        throw new NotFoundException(`No se encontró la donación con id ${id}`);
      }
      if (donation.status !== DonationStatus.RECIBIDA) {
        throw new BadRequestException(
          `Solo se pueden anular donaciones en estado ${DonationStatus.RECIBIDA}; esta donación está ${donation.status}`,
        );
      }

      await this.inventoryService.decreaseStock(
        manager,
        donation.product.id,
        donation.quantity,
      );
      donation.status = DonationStatus.ANULADA;
      await manager.save(donation);
    });

    return this.findOne(id);
  }

  async findAll(
    query: FilterDonationDto,
  ): Promise<PaginatedResponse<Donation>> {
    const { page, limit, donorId, productId, status } = query;
    const where: FindOptionsWhere<Donation> = {};
    if (donorId) where.donor = { id: donorId };
    if (productId) where.product = { id: productId };
    if (status) where.status = status;

    const [data, total] = await this.donationRepository.findAndCount({
      where,
      relations: { donor: true, product: true },
      order: { createdAt: 'DESC' },
      skip: getSkip(page, limit),
      take: limit,
    });
    return buildPaginatedResponse(data, total, page, limit);
  }

  async findByDonor(
    donorId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Donation>> {
    await this.donorService.findOne(donorId);
    return this.findAll({ page: query.page, limit: query.limit, donorId });
  }

  async getSummary(): Promise<DonationSummaryItemDto[]> {
    const rows = await this.donationRepository
      .createQueryBuilder('donation')
      .innerJoin('donation.product', 'product')
      .select('product.id', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('product.category', 'category')
      .addSelect('product.unit', 'unit')
      .addSelect('SUM(donation.quantity)', 'totalQuantity')
      .addSelect('COUNT(donation.id)', 'donationsCount')
      .where('donation.status = :status', { status: DonationStatus.RECIBIDA })
      .groupBy('product.id')
      .orderBy('"totalQuantity"', 'DESC')
      .getRawMany<
        Omit<DonationSummaryItemDto, 'totalQuantity' | 'donationsCount'> & {
          totalQuantity: string;
          donationsCount: string;
        }
      >();

    return rows.map((row) => ({
      ...row,
      totalQuantity: Number(row.totalQuantity),
      donationsCount: Number(row.donationsCount),
    }));
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
