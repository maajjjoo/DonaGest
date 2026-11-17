import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { escapeLike } from '../common/helpers/escape-like.helper';
import {
  buildPaginatedResponse,
  getSkip,
} from '../common/helpers/paginate.helper';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { Inventory } from '../inventory/entities/inventory.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    await this.ensureUniqueName(dto.name);
    const product = this.productRepository.create({
      ...dto,
      inventory: new Inventory(),
    });
    const saved = await this.productRepository.save(product);
    return this.findOne(saved.id);
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Product>> {
    const { page, limit } = query;
    const [data, total] = await this.productRepository.findAndCount({
      relations: { inventory: true },
      order: { name: 'ASC' },
      skip: getSkip(page, limit),
      take: limit,
    });
    return buildPaginatedResponse(data, total, page, limit);
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: { inventory: true },
    });
    if (!product) {
      throw new NotFoundException(`No se encontró el producto con id ${id}`);
    }
    return product;
  }

  async replace(id: string, dto: CreateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    await this.ensureUniqueName(dto.name, id);
    const { description = null, ...data } = dto;
    Object.assign(product, data, { description });
    return this.productRepository.save(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    if (dto.name) {
      await this.ensureUniqueName(dto.name, id);
    }
    const updated = this.productRepository.merge(product, dto);
    return this.productRepository.save(updated);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  private async ensureUniqueName(name: string, excludeId?: string) {
    const existing = await this.productRepository.findOne({
      where: { name: ILike(escapeLike(name)) },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`Ya existe un producto llamado "${name}"`);
    }
  }
}
