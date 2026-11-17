import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Product } from '../product/entities/product.entity';
import { ProductCategory } from '../product/enums/product-category.enum';
import { InventoryAdjustment } from './entities/inventory-adjustment.entity';
import { Inventory } from './entities/inventory.entity';
import { InventoryService } from './inventory.service';

const PRODUCT_ID = '71133dd2-0f7f-45eb-895b-b269fa9adf74';
const INVENTORY_ID = '0c6d50b0-6191-429f-b981-a9f195366293';

const buildInventory = (availableQuantity: number): Inventory =>
  ({
    id: INVENTORY_ID,
    product: { id: PRODUCT_ID, name: 'Arroz blanco 1 kg' } as Product,
    availableQuantity,
    minimumStock: 10,
  }) as Inventory;

const buildManager = (inventory: Inventory | null) => {
  const queryBuilder = {
    setLock: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(inventory),
  };
  const manager = {
    getRepository: jest.fn().mockReturnValue({
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    }),
    save: jest.fn((entity: unknown) => Promise.resolve(entity)),
    create: jest.fn(
      (_entity: unknown, data: Partial<InventoryAdjustment>) => data,
    ),
  };
  return { manager, queryBuilder };
};

describe('InventoryService', () => {
  let service: InventoryService;
  let repository: Partial<Record<keyof Repository<Inventory>, jest.Mock>>;
  let dataSource: { transaction: jest.Mock };
  let adjustmentRepository: { findAndCount: jest.Mock };

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    dataSource = { transaction: jest.fn() };
    adjustmentRepository = { findAndCount: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: getRepositoryToken(Inventory), useValue: repository },
        {
          provide: getRepositoryToken(InventoryAdjustment),
          useValue: adjustmentRepository,
        },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = moduleRef.get(InventoryService);
  });

  describe('increaseStock', () => {
    it('suma la cantidad y bloquea la fila del inventario', async () => {
      const { manager, queryBuilder } = buildManager(buildInventory(20));

      const result = await service.increaseStock(
        manager as unknown as EntityManager,
        PRODUCT_ID,
        30,
      );

      expect(queryBuilder.setLock).toHaveBeenCalledWith('pessimistic_write');
      expect(result.availableQuantity).toBe(50);
      expect(manager.save).toHaveBeenCalled();
    });

    it('lanza 404 si el producto no tiene inventario', async () => {
      const { manager } = buildManager(null);

      await expect(
        service.increaseStock(
          manager as unknown as EntityManager,
          PRODUCT_ID,
          5,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('decreaseStock', () => {
    it('resta la cantidad cuando hay stock suficiente', async () => {
      const { manager } = buildManager(buildInventory(20));

      const result = await service.decreaseStock(
        manager as unknown as EntityManager,
        PRODUCT_ID,
        20,
      );

      expect(result.availableQuantity).toBe(0);
    });

    it('lanza 409 con el detalle cuando el stock no alcanza', async () => {
      const { manager } = buildManager(buildInventory(5));

      await expect(
        service.decreaseStock(
          manager as unknown as EntityManager,
          PRODUCT_ID,
          8,
        ),
      ).rejects.toThrow(
        new ConflictException('Stock insuficiente: disponible 5, solicitado 8'),
      );
      expect(manager.save).not.toHaveBeenCalled();
    });
  });

  describe('adjust', () => {
    it('descuenta y guarda el ajuste con su motivo', async () => {
      repository.findOne?.mockResolvedValue(buildInventory(50));
      const { manager } = buildManager(buildInventory(50));
      dataSource.transaction.mockImplementation(
        (work: (m: EntityManager) => Promise<void>) =>
          work(manager as unknown as EntityManager),
      );

      await service.adjust(INVENTORY_ID, {
        quantity: -12,
        reason: 'Producto vencido',
      });

      expect(manager.create).toHaveBeenCalledWith(
        InventoryAdjustment,
        expect.objectContaining({
          quantity: -12,
          previousQuantity: 50,
          newQuantity: 38,
          reason: 'Producto vencido',
        }),
      );
    });

    it('no deja que el inventario quede en negativo', async () => {
      repository.findOne?.mockResolvedValue(buildInventory(3));
      const { manager } = buildManager(buildInventory(3));
      dataSource.transaction.mockImplementation(
        (work: (m: EntityManager) => Promise<void>) =>
          work(manager as unknown as EntityManager),
      );

      await expect(
        service.adjust(INVENTORY_ID, {
          quantity: -10,
          reason: 'Producto dañado',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateMinimumStock', () => {
    it('cambia el stock mínimo', async () => {
      const inventory = buildInventory(5);
      repository.findOne?.mockResolvedValue(inventory);
      repository.save?.mockImplementation((entity: Inventory) =>
        Promise.resolve(entity),
      );

      const result = await service.updateMinimumStock(INVENTORY_ID, {
        minimumStock: 50,
      });

      expect(result.minimumStock).toBe(50);
    });
  });

  describe('findAdjustments', () => {
    it('devuelve los ajustes del inventario, del más reciente al más antiguo', async () => {
      repository.findOne?.mockResolvedValue(buildInventory(55));
      const adjustments = [
        { quantity: 12, previousQuantity: 55, newQuantity: 67 },
        { quantity: -5, previousQuantity: 60, newQuantity: 55 },
      ];
      adjustmentRepository.findAndCount.mockResolvedValue([adjustments, 2]);

      const result = await service.findAdjustments(INVENTORY_ID, {
        page: 1,
        limit: 10,
      });

      expect(adjustmentRepository.findAndCount).toHaveBeenCalledWith({
        where: { inventory: { id: INVENTORY_ID } },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result.data).toBe(adjustments);
      expect(result.meta.total).toBe(2);
    });

    it('lanza 404 si el inventario no existe', async () => {
      repository.findOne?.mockResolvedValue(null);

      await expect(
        service.findAdjustments(INVENTORY_ID, { page: 1, limit: 10 }),
      ).rejects.toThrow(NotFoundException);
      expect(adjustmentRepository.findAndCount).not.toHaveBeenCalled();
    });
  });

  describe('findAlerts', () => {
    const buildAlertsQueryBuilder = () => {
      const builder = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[buildInventory(3)], 1]),
      };
      repository.createQueryBuilder?.mockReturnValue(builder);
      return builder;
    };

    it('filtra las alertas por categoría', async () => {
      const builder = buildAlertsQueryBuilder();

      const result = await service.findAlerts({
        page: 1,
        limit: 10,
        category: ProductCategory.ROPA,
      });

      expect(builder.andWhere).toHaveBeenCalledWith(
        'product.category = :category',
        { category: ProductCategory.ROPA },
      );
      expect(result.meta.total).toBe(1);
    });

    it('sin categoría no agrega el filtro', async () => {
      const builder = buildAlertsQueryBuilder();

      await service.findAlerts({ page: 2, limit: 5 });

      expect(builder.andWhere).not.toHaveBeenCalled();
      expect(builder.offset).toHaveBeenCalledWith(5);
      expect(builder.limit).toHaveBeenCalledWith(5);
    });
  });
});
