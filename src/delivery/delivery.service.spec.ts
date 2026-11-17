import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { AffectedZoneService } from '../affected-zone/affected-zone.service';
import { AffectedZone } from '../affected-zone/entities/affected-zone.entity';
import { addDays, getTodayInColombia } from '../common/helpers/date.helper';
import { InventoryService } from '../inventory/inventory.service';
import { Product } from '../product/entities/product.entity';
import { DeliveryService } from './delivery.service';
import { Delivery } from './entities/delivery.entity';
import { DeliveryStatus } from './enums/delivery-status.enum';

const ZONE_ID = 'd1055e76-08b4-4d7a-b242-d493f80e7d90';
const PRODUCT_ID = '2d4fa920-1a74-4bd1-9cc3-e21723d27855';
const DELIVERY_ID = '98b0d1a1-4800-444f-9e58-608184562d1e';

const activeZone = {
  id: ZONE_ID,
  name: 'Casco urbano San Marcos',
  isActive: true,
} as AffectedZone;
const product = { id: PRODUCT_ID, name: 'Suero oral' } as Product;

const buildDelivery = (status: DeliveryStatus): Delivery =>
  ({
    id: DELIVERY_ID,
    affectedZone: activeZone,
    product,
    quantity: 120,
    status,
    scheduledDate: '2026-11-20',
    deliveredAt: null,
    notes: null,
  }) as Delivery;

describe('DeliveryService', () => {
  let service: DeliveryService;
  let inventoryService: { increaseStock: jest.Mock; decreaseStock: jest.Mock };
  let manager: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock };

  beforeEach(async () => {
    inventoryService = {
      increaseStock: jest.fn(),
      decreaseStock: jest.fn(),
    };
    manager = {
      findOne: jest.fn(),
      save: jest.fn((entity: Delivery) =>
        Promise.resolve({ ...entity, id: DELIVERY_ID }),
      ),
      create: jest.fn((_entity: unknown, data: Partial<Delivery>) => data),
    };
    const dataSource = {
      transaction: jest.fn((work: (m: EntityManager) => Promise<unknown>) =>
        work(manager as unknown as EntityManager),
      ),
    };
    const repository = {
      findOne: jest
        .fn()
        .mockResolvedValue(buildDelivery(DeliveryStatus.PROGRAMADA)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        DeliveryService,
        { provide: getRepositoryToken(Delivery), useValue: repository },
        { provide: InventoryService, useValue: inventoryService },
        { provide: AffectedZoneService, useValue: { findOne: jest.fn() } },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = moduleRef.get(DeliveryService);
  });

  describe('updateStatus', () => {
    it.each([
      [DeliveryStatus.PROGRAMADA, DeliveryStatus.EN_TRANSITO],
      [DeliveryStatus.EN_TRANSITO, DeliveryStatus.ENTREGADA],
    ])('cambia de %s a %s sin tocar el inventario', async (from, to) => {
      const delivery = buildDelivery(from);
      manager.findOne.mockResolvedValueOnce(delivery);

      await service.updateStatus(DELIVERY_ID, { status: to });

      expect(delivery.status).toBe(to);
      expect(manager.save).toHaveBeenCalledWith(delivery);
      expect(inventoryService.increaseStock).not.toHaveBeenCalled();
    });

    it('guarda la fecha de entrega al marcarla ENTREGADA', async () => {
      const delivery = buildDelivery(DeliveryStatus.EN_TRANSITO);
      manager.findOne.mockResolvedValueOnce(delivery);

      await service.updateStatus(DELIVERY_ID, {
        status: DeliveryStatus.ENTREGADA,
      });

      expect(delivery.deliveredAt).toBeInstanceOf(Date);
    });

    it.each([DeliveryStatus.PROGRAMADA, DeliveryStatus.EN_TRANSITO])(
      'al cancelar desde %s devuelve el stock en la misma transacción',
      async (from) => {
        const delivery = buildDelivery(from);
        manager.findOne.mockResolvedValueOnce(delivery);

        await service.updateStatus(DELIVERY_ID, {
          status: DeliveryStatus.CANCELADA,
        });

        expect(inventoryService.increaseStock).toHaveBeenCalledWith(
          manager,
          PRODUCT_ID,
          120,
        );
        expect(delivery.status).toBe(DeliveryStatus.CANCELADA);
      },
    );

    it('lanza 400 con una transición inválida', async () => {
      manager.findOne.mockResolvedValueOnce(
        buildDelivery(DeliveryStatus.PROGRAMADA),
      );

      await expect(
        service.updateStatus(DELIVERY_ID, {
          status: DeliveryStatus.ENTREGADA,
        }),
      ).rejects.toThrow(
        new BadRequestException(
          'No se puede pasar de PROGRAMADA a ENTREGADA. Desde PROGRAMADA solo se permite: EN_TRANSITO, CANCELADA',
        ),
      );
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('lanza 400 si la entrega ya fue entregada', async () => {
      manager.findOne.mockResolvedValueOnce(
        buildDelivery(DeliveryStatus.ENTREGADA),
      );

      await expect(
        service.updateStatus(DELIVERY_ID, {
          status: DeliveryStatus.CANCELADA,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(inventoryService.increaseStock).not.toHaveBeenCalled();
    });

    it('lanza 404 si la entrega no existe', async () => {
      manager.findOne.mockResolvedValueOnce(null);

      await expect(
        service.updateStatus(DELIVERY_ID, {
          status: DeliveryStatus.EN_TRANSITO,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const tomorrow = addDays(getTodayInColombia(), 1);
    const dto = {
      affectedZoneId: ZONE_ID,
      productId: PRODUCT_ID,
      quantity: 120,
      scheduledDate: tomorrow,
    };

    it('descuenta el stock y guarda la entrega', async () => {
      manager.findOne
        .mockResolvedValueOnce(activeZone)
        .mockResolvedValueOnce(product);

      await service.create(dto);

      expect(inventoryService.decreaseStock).toHaveBeenCalledWith(
        manager,
        PRODUCT_ID,
        120,
      );
      expect(manager.save).toHaveBeenCalled();
    });

    it('lanza 409 si no hay stock suficiente y no guarda la entrega', async () => {
      manager.findOne
        .mockResolvedValueOnce(activeZone)
        .mockResolvedValueOnce(product);
      inventoryService.decreaseStock.mockRejectedValueOnce(
        new ConflictException(
          'Stock insuficiente: disponible 50, solicitado 120',
        ),
      );

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('lanza 400 si la zona está inactiva', async () => {
      manager.findOne.mockResolvedValueOnce({
        ...activeZone,
        isActive: false,
      });

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(inventoryService.decreaseStock).not.toHaveBeenCalled();
    });

    it('lanza 400 si la fecha está en el pasado', async () => {
      await expect(
        service.create({
          ...dto,
          scheduledDate: addDays(getTodayInColombia(), -1),
        }),
      ).rejects.toThrow(BadRequestException);
      expect(manager.findOne).not.toHaveBeenCalled();
    });
  });
});
