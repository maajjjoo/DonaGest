import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AffectedZone } from '../affected-zone/entities/affected-zone.entity';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { getTodayInColombia } from '../common/helpers/date.helper';
import {
  buildPaginatedResponse,
  getSkip,
} from '../common/helpers/paginate.helper';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { InventoryService } from '../inventory/inventory.service';
import { Product } from '../product/entities/product.entity';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { Delivery } from './entities/delivery.entity';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(Delivery)
    private readonly deliveryRepository: Repository<Delivery>,
    private readonly inventoryService: InventoryService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateDeliveryDto): Promise<Delivery> {
    const today = getTodayInColombia();
    if (dto.scheduledDate < today) {
      throw new BadRequestException(
        `La fecha programada (${dto.scheduledDate}) no puede ser anterior a hoy (${today})`,
      );
    }

    const deliveryId = await this.dataSource.transaction(async (manager) => {
      const zone = await manager.findOne(AffectedZone, {
        where: { id: dto.affectedZoneId },
      });
      if (!zone) {
        throw new NotFoundException(
          `No se encontró la zona afectada con id ${dto.affectedZoneId}`,
        );
      }
      if (!zone.isActive) {
        throw new BadRequestException(
          `La zona "${zone.name}" está inactiva y no puede recibir entregas`,
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

      await this.inventoryService.decreaseStock(
        manager,
        product.id,
        dto.quantity,
      );
      const delivery = await manager.save(
        manager.create(Delivery, {
          affectedZone: zone,
          product,
          quantity: dto.quantity,
          scheduledDate: dto.scheduledDate,
          notes: dto.notes ?? null,
        }),
      );
      return delivery.id;
    });

    return this.findOne(deliveryId);
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Delivery>> {
    const { page, limit } = query;
    const [data, total] = await this.deliveryRepository.findAndCount({
      relations: { affectedZone: true, product: true },
      order: { scheduledDate: 'ASC', createdAt: 'DESC' },
      skip: getSkip(page, limit),
      take: limit,
    });
    return buildPaginatedResponse(data, total, page, limit);
  }

  async findOne(id: string): Promise<Delivery> {
    const delivery = await this.deliveryRepository.findOne({
      where: { id },
      relations: { affectedZone: true, product: true },
    });
    if (!delivery) {
      throw new NotFoundException(`No se encontró la entrega con id ${id}`);
    }
    return delivery;
  }
}
