import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AffectedZoneService } from '../affected-zone/affected-zone.service';
import { AffectedZone } from '../affected-zone/entities/affected-zone.entity';
import { Delivery } from '../delivery/entities/delivery.entity';
import { Donation } from '../donation/entities/donation.entity';
import { Donor } from '../donor/entities/donor.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { ProductCategory } from '../product/enums/product-category.enum';
import { ReportService } from './report.service';

const ZONE_ID = 'd1055e76-08b4-4d7a-b242-d493f80e7d90';

const buildQueryBuilder = (result: {
  raw?: unknown[];
  count?: number;
  many?: unknown[];
}) => {
  const qb = {
    select: jest.fn(),
    addSelect: jest.fn(),
    innerJoin: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    groupBy: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    limit: jest.fn(),
    getRawMany: jest.fn().mockResolvedValue(result.raw ?? []),
    getCount: jest.fn().mockResolvedValue(result.count ?? 0),
    getMany: jest.fn().mockResolvedValue(result.many ?? []),
  };
  for (const key of [
    'select',
    'addSelect',
    'innerJoin',
    'where',
    'andWhere',
    'groupBy',
    'orderBy',
    'addOrderBy',
    'limit',
  ] as const) {
    qb[key].mockReturnValue(qb);
  }
  return qb;
};

describe('ReportService', () => {
  let service: ReportService;
  let donorRepository: { count: jest.Mock };
  let donationRepository: { createQueryBuilder: jest.Mock };
  let deliveryRepository: { createQueryBuilder: jest.Mock };
  let zoneRepository: { createQueryBuilder: jest.Mock };
  let inventoryRepository: { createQueryBuilder: jest.Mock };
  let affectedZoneService: { findOne: jest.Mock };

  beforeEach(async () => {
    donorRepository = { count: jest.fn() };
    donationRepository = { createQueryBuilder: jest.fn() };
    deliveryRepository = { createQueryBuilder: jest.fn() };
    zoneRepository = { createQueryBuilder: jest.fn() };
    inventoryRepository = { createQueryBuilder: jest.fn() };
    affectedZoneService = { findOne: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ReportService,
        { provide: getRepositoryToken(Donor), useValue: donorRepository },
        { provide: getRepositoryToken(Donation), useValue: donationRepository },
        { provide: getRepositoryToken(Delivery), useValue: deliveryRepository },
        { provide: getRepositoryToken(AffectedZone), useValue: zoneRepository },
        {
          provide: getRepositoryToken(Inventory),
          useValue: inventoryRepository,
        },
        { provide: AffectedZoneService, useValue: affectedZoneService },
      ],
    }).compile();

    service = moduleRef.get(ReportService);
  });

  describe('getSummary', () => {
    it('arma el resumen y llena con 0 los estados sin datos', async () => {
      donorRepository.count.mockResolvedValue(4);
      donationRepository.createQueryBuilder.mockReturnValue(
        buildQueryBuilder({
          raw: [
            { status: 'RECIBIDA', count: '5', units: '1200' },
            { status: 'ANULADA', count: '1', units: '50' },
          ],
        }),
      );
      deliveryRepository.createQueryBuilder.mockReturnValue(
        buildQueryBuilder({
          raw: [
            { key: 'PROGRAMADA', count: '2' },
            { key: 'ENTREGADA', count: '3' },
          ],
        }),
      );
      zoneRepository.createQueryBuilder.mockReturnValue(
        buildQueryBuilder({ raw: [{ key: 'CRITICA', count: '1' }] }),
      );
      inventoryRepository.createQueryBuilder.mockReturnValue(
        buildQueryBuilder({ count: 2 }),
      );

      const result = await service.getSummary();

      expect(result.donors.total).toBe(4);
      expect(result.donations).toEqual({
        received: 5,
        cancelled: 1,
        unitsDonated: 1200,
      });
      expect(result.deliveries).toEqual({
        PROGRAMADA: 2,
        EN_TRANSITO: 0,
        ENTREGADA: 3,
        CANCELADA: 0,
        total: 5,
      });
      expect(result.activeZonesByPriority).toEqual({
        BAJA: 0,
        MEDIA: 0,
        ALTA: 0,
        CRITICA: 1,
        total: 1,
      });
      expect(result.productsInAlert).toBe(2);
    });

    it('devuelve todo en 0 cuando no hay datos', async () => {
      donorRepository.count.mockResolvedValue(0);
      for (const repository of [
        donationRepository,
        deliveryRepository,
        zoneRepository,
        inventoryRepository,
      ]) {
        repository.createQueryBuilder.mockReturnValue(buildQueryBuilder({}));
      }

      const result = await service.getSummary();

      expect(result.donations.unitsDonated).toBe(0);
      expect(result.deliveries.total).toBe(0);
      expect(result.activeZonesByPriority.total).toBe(0);
    });
  });

  describe('getZoneReport', () => {
    it('suma las unidades entregadas por producto', async () => {
      const zone = { id: ZONE_ID, name: 'San Marcos' } as AffectedZone;
      affectedZoneService.findOne.mockResolvedValue(zone);
      deliveryRepository.createQueryBuilder
        .mockReturnValueOnce(
          buildQueryBuilder({
            raw: [
              { key: 'ENTREGADA', count: '2' },
              { key: 'CANCELADA', count: '1' },
            ],
          }),
        )
        .mockReturnValueOnce(
          buildQueryBuilder({
            raw: [
              {
                productId: 'p1',
                productName: 'Agua potable',
                unit: 'PAQUETE',
                unitsDelivered: '200',
              },
              {
                productId: 'p2',
                productName: 'Suero oral',
                unit: 'UNIDAD',
                unitsDelivered: '40',
              },
            ],
          }),
        );

      const result = await service.getZoneReport(ZONE_ID);

      expect(result.zone).toBe(zone);
      expect(result.deliveriesByStatus.ENTREGADA).toBe(2);
      expect(result.deliveriesByStatus.total).toBe(3);
      expect(result.deliveredProducts[0].unitsDelivered).toBe(200);
      expect(result.totalUnitsDelivered).toBe(240);
    });

    it('lanza 404 si la zona no existe', async () => {
      affectedZoneService.findOne.mockRejectedValue(
        new NotFoundException('No se encontró la zona afectada'),
      );

      await expect(service.getZoneReport(ZONE_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(deliveryRepository.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('getTopDonors', () => {
    it('limita a 5 y convierte los totales a número', async () => {
      const qb = buildQueryBuilder({
        raw: [
          {
            donorId: 'd1',
            fullName: 'Fundación Bolívar',
            donorType: 'FUNDACION',
            city: 'Bogotá',
            unitsDonated: '2500',
            donationsCount: '6',
          },
        ],
      });
      donationRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getTopDonors();

      expect(qb.limit).toHaveBeenCalledWith(5);
      expect(result[0].unitsDonated).toBe(2500);
      expect(result[0].donationsCount).toBe(6);
    });
  });

  describe('getInventoryByCategory', () => {
    it('incluye todas las categorías aunque no tengan productos', async () => {
      inventoryRepository.createQueryBuilder.mockReturnValue(
        buildQueryBuilder({
          raw: [
            {
              category: ProductCategory.AGUA,
              productsCount: '2',
              availableUnits: '800',
              productsInAlert: '1',
            },
          ],
        }),
      );

      const result = await service.getInventoryByCategory();

      expect(result).toHaveLength(Object.values(ProductCategory).length);
      expect(
        result.find((item) => item.category === ProductCategory.AGUA),
      ).toEqual({
        category: ProductCategory.AGUA,
        productsCount: 2,
        availableUnits: 800,
        productsInAlert: 1,
      });
      expect(
        result.find((item) => item.category === ProductCategory.ROPA)
          ?.availableUnits,
      ).toBe(0);
    });
  });

  describe('getZonesWithoutDeliveries', () => {
    it('ordena por prioridad y familias afectadas', async () => {
      const zones = [{ name: 'Quibdó' }, { name: 'Uribia' }];
      const qb = buildQueryBuilder({ many: zones });
      zoneRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getZonesWithoutDeliveries();

      expect(qb.orderBy).toHaveBeenCalledWith('zone.priority', 'DESC');
      expect(qb.addOrderBy).toHaveBeenCalledWith(
        'zone.affectedFamilies',
        'DESC',
      );
      expect(result).toBe(zones);
    });
  });
});
