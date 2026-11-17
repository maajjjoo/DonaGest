import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import {
  buildPaginatedResponse,
  getSkip,
} from '../common/helpers/paginate.helper';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { UpdateMinimumStockDto } from './dto/update-minimum-stock.dto';
import { InventoryAdjustment } from './entities/inventory-adjustment.entity';
import { Inventory } from './entities/inventory.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Inventory>> {
    const { page, limit } = query;
    const [data, total] = await this.inventoryRepository.findAndCount({
      relations: { product: true },
      order: { product: { name: 'ASC' } },
      skip: getSkip(page, limit),
      take: limit,
    });
    return buildPaginatedResponse(data, total, page, limit);
  }

  async findAlerts(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Inventory>> {
    const { page, limit } = query;
    const [data, total] = await this.inventoryRepository
      .createQueryBuilder('inventory')
      .innerJoinAndSelect('inventory.product', 'product')
      .where('inventory.availableQuantity <= inventory.minimumStock')
      .orderBy('inventory.available_quantity - inventory.minimum_stock', 'ASC')
      .addOrderBy('product.name', 'ASC')
      .offset(getSkip(page, limit))
      .limit(limit)
      .getManyAndCount();
    return buildPaginatedResponse(data, total, page, limit);
  }

  async updateMinimumStock(
    id: string,
    dto: UpdateMinimumStockDto,
  ): Promise<Inventory> {
    const inventory = await this.findOne(id);
    inventory.minimumStock = dto.minimumStock;
    return this.inventoryRepository.save(inventory);
  }

  async findOne(id: string): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
      relations: { product: true },
    });
    if (!inventory) {
      throw new NotFoundException(`No se encontró el inventario con id ${id}`);
    }
    return inventory;
  }

  async findByProduct(productId: string): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { product: { id: productId } },
      relations: { product: true },
    });
    if (!inventory) {
      throw new NotFoundException(
        `No se encontró inventario para el producto con id ${productId}`,
      );
    }
    return inventory;
  }

  async increaseStock(
    manager: EntityManager,
    productId: string,
    quantity: number,
  ): Promise<Inventory> {
    const inventory = await this.lockByProduct(manager, productId);
    inventory.availableQuantity += quantity;
    return manager.save(inventory);
  }

  async decreaseStock(
    manager: EntityManager,
    productId: string,
    quantity: number,
  ): Promise<Inventory> {
    const inventory = await this.lockByProduct(manager, productId);
    if (inventory.availableQuantity < quantity) {
      throw new ConflictException(
        `Stock insuficiente: disponible ${inventory.availableQuantity}, solicitado ${quantity}`,
      );
    }
    inventory.availableQuantity -= quantity;
    return manager.save(inventory);
  }

  async adjust(id: string, dto: AdjustInventoryDto): Promise<Inventory> {
    const { product } = await this.findOne(id);

    await this.dataSource.transaction(async (manager) => {
      const before = await this.lockByProduct(manager, product.id);
      const previousQuantity = before.availableQuantity;
      const after =
        dto.quantity > 0
          ? await this.increaseStock(manager, product.id, dto.quantity)
          : await this.decreaseStock(manager, product.id, -dto.quantity);

      await manager.save(
        manager.create(InventoryAdjustment, {
          inventory: after,
          quantity: dto.quantity,
          previousQuantity,
          newQuantity: after.availableQuantity,
          reason: dto.reason,
        }),
      );
    });

    return this.findOne(id);
  }

  private async lockByProduct(
    manager: EntityManager,
    productId: string,
  ): Promise<Inventory> {
    const inventory = await manager
      .getRepository(Inventory)
      .createQueryBuilder('inventory')
      .setLock('pessimistic_write')
      .where('inventory.product_id = :productId', { productId })
      .getOne();
    if (!inventory) {
      throw new NotFoundException(
        `No se encontró inventario para el producto con id ${productId}`,
      );
    }
    return inventory;
  }
}
