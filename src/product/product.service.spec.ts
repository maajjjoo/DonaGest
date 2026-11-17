import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Inventory } from '../inventory/entities/inventory.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './entities/product.entity';
import { ProductCategory } from './enums/product-category.enum';
import { ProductUnit } from './enums/product-unit.enum';
import { ProductService } from './product.service';

type MockRepository = Partial<Record<keyof Repository<Product>, jest.Mock>>;

const createDto: CreateProductDto = {
  name: 'Agua potable en bolsa 6 L',
  category: ProductCategory.AGUA,
  unit: ProductUnit.PAQUETE,
  description: 'Bolsas de agua para familias sin acueducto',
};

const buildProduct = (overrides: Partial<Product> = {}): Product =>
  ({
    id: '7995f153-f381-45e8-8b23-fedf0d0712fe',
    ...createDto,
    inventory: { availableQuantity: 0, minimumStock: 10 } as Inventory,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as Product;

describe('ProductService', () => {
  let service: ProductService;
  let repository: MockRepository;

  beforeEach(async () => {
    repository = {
      create: jest.fn((data: Partial<Product>) => ({ ...data })),
      save: jest.fn((product: Product) =>
        Promise.resolve({ ...product, id: product.id ?? 'nuevo-id' }),
      ),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      merge: jest.fn((product: Product, changes: Partial<Product>) =>
        Object.assign(product, changes),
      ),
      remove: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: getRepositoryToken(Product), useValue: repository },
      ],
    }).compile();

    service = moduleRef.get(ProductService);
  });

  describe('create', () => {
    it('crea el producto junto con su inventario en 0', async () => {
      repository.findOne
        ?.mockResolvedValueOnce(null)
        .mockResolvedValueOnce(buildProduct());

      const result = await service.create(createDto);

      const created = (repository.create as jest.Mock).mock
        .calls[0][0] as Product;
      expect(created.inventory).toBeInstanceOf(Inventory);
      expect(result.inventory.availableQuantity).toBe(0);
    });

    it('lanza 409 si ya existe un producto con ese nombre', async () => {
      repository.findOne?.mockResolvedValueOnce(buildProduct());

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('busca en nombre y descripción dentro de la categoría', async () => {
      repository.findAndCount?.mockResolvedValue([[buildProduct()], 1]);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        category: ProductCategory.AGUA,
        search: 'agua',
      });

      const findAndCount = repository.findAndCount as jest.Mock;
      const [[options]] = findAndCount.mock.calls as [[{ where: object[] }]];
      expect(options.where).toHaveLength(2);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOutOfStock', () => {
    it('filtra los productos con inventario en 0', async () => {
      repository.findAndCount?.mockResolvedValue([[buildProduct()], 1]);

      await service.findOutOfStock({ page: 1, limit: 10 });

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { inventory: { availableQuantity: 0 } },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('lanza 404 si el producto no existe', async () => {
      repository.findOne?.mockResolvedValue(null);

      await expect(service.findOne('no-existe')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('permite cambiar el nombre si no lo usa otro producto', async () => {
      const product = buildProduct();
      repository.findOne
        ?.mockResolvedValueOnce(product)
        .mockResolvedValueOnce(product);

      const result = await service.update(product.id, {
        name: 'AGUA POTABLE EN BOLSA 6 L',
      });

      expect(result.name).toBe('AGUA POTABLE EN BOLSA 6 L');
    });

    it('lanza 409 si el nombre ya lo usa otro producto', async () => {
      repository.findOne
        ?.mockResolvedValueOnce(buildProduct())
        .mockResolvedValueOnce(buildProduct({ id: 'otro-producto' }));

      await expect(
        service.update('7995f153-f381-45e8-8b23-fedf0d0712fe', {
          name: 'Arroz blanco 1 kg',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('replace', () => {
    it('deja la descripción en null si no se envía', async () => {
      const product = buildProduct();
      repository.findOne
        ?.mockResolvedValueOnce(product)
        .mockResolvedValueOnce(null);

      const result = await service.replace(product.id, {
        name: 'Agua potable en bolsa 6 L',
        category: ProductCategory.AGUA,
        unit: ProductUnit.PAQUETE,
      });

      expect(result.description).toBeNull();
    });
  });

  describe('remove', () => {
    it('elimina un producto existente', async () => {
      const product = buildProduct();
      repository.findOne?.mockResolvedValue(product);

      await service.remove(product.id);

      expect(repository.remove).toHaveBeenCalledWith(product);
    });

    it('lanza 409 con mensaje claro si el producto tiene donaciones o entregas', async () => {
      repository.findOne?.mockResolvedValue(buildProduct());
      repository.remove?.mockRejectedValue(
        new QueryFailedError(
          'DELETE FROM products',
          [],
          Object.assign(new Error('violates foreign key constraint'), {
            code: '23503',
          }),
        ),
      );

      await expect(
        service.remove('7995f153-f381-45e8-8b23-fedf0d0712fe'),
      ).rejects.toThrow(
        new ConflictException(
          'No se puede eliminar "Agua potable en bolsa 6 L" porque tiene donaciones o entregas registradas',
        ),
      );
    });
  });
});
