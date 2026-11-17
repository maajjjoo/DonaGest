import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import {
  buildPaginatedResponse,
  getSkip,
} from '../common/helpers/paginate.helper';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { UpdateMinimumStockDto } from './dto/update-minimum-stock.dto';
import { Inventory } from './entities/inventory.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
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
}
