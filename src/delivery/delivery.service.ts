import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  DataSource,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { AffectedZone } from '../affected-zone/entities/affected-zone.entity';
import { getTodayInColombia } from '../common/helpers/date.helper';
import {
  buildPaginatedResponse,
  getSkip,
} from '../common/helpers/paginate.helper';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { InventoryService } from '../inventory/inventory.service';
import { Product } from '../product/entities/product.entity';
import {
  canTransition,
  DELIVERY_STATUS_TRANSITIONS,
} from './constants/delivery-status-transitions';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { FilterDeliveryDto } from './dto/filter-delivery.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
import { Delivery } from './entities/delivery.entity';
import { DeliveryStatus } from './enums/delivery-status.enum';

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

  async updateStatus(
    id: string,
    dto: UpdateDeliveryStatusDto,
  ): Promise<Delivery> {
    await this.dataSource.transaction(async (manager) => {
      const delivery = await manager.findOne(Delivery, {
        where: { id },
        relations: { product: true },
        lock: { mode: 'pessimistic_write', tables: ['deliveries'] },
      });
      if (!delivery) {
        throw new NotFoundException(`No se encontró la entrega con id ${id}`);
      }

      if (!canTransition(delivery.status, dto.status)) {
        const allowed = DELIVERY_STATUS_TRANSITIONS[delivery.status];
        throw new BadRequestException(
          allowed.length
            ? `No se puede pasar de ${delivery.status} a ${dto.status}. Desde ${delivery.status} solo se permite: ${allowed.join(', ')}`
            : `La entrega ya está ${delivery.status} y no puede cambiar de estado`,
        );
      }

      if (dto.status === DeliveryStatus.CANCELADA) {
        await this.inventoryService.increaseStock(
          manager,
          delivery.product.id,
          delivery.quantity,
        );
      }
      if (dto.status === DeliveryStatus.ENTREGADA) {
        delivery.deliveredAt = new Date();
      }
      if (dto.notes !== undefined) {
        delivery.notes = dto.notes;
      }
      delivery.status = dto.status;
      await manager.save(delivery);
    });

    return this.findOne(id);
  }

  async findAll(
    query: FilterDeliveryDto,
  ): Promise<PaginatedResponse<Delivery>> {
    const { page, limit, affectedZoneId, productId, status, from, to } = query;
    if (from && to && from > to) {
      throw new BadRequestException(
        'La fecha inicial (from) no puede ser mayor que la final (to)',
      );
    }

    const where: FindOptionsWhere<Delivery> = {};
    if (affectedZoneId) where.affectedZone = { id: affectedZoneId };
    if (productId) where.product = { id: productId };
    if (status) where.status = status;
    if (from && to) where.scheduledDate = Between(from, to);
    else if (from) where.scheduledDate = MoreThanOrEqual(from);
    else if (to) where.scheduledDate = LessThanOrEqual(to);

    const [data, total] = await this.deliveryRepository.findAndCount({
      where,
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
