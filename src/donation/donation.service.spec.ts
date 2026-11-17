import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { DonorService } from '../donor/donor.service';
import { Donor } from '../donor/entities/donor.entity';
import { InventoryService } from '../inventory/inventory.service';
import { Product } from '../product/entities/product.entity';
import { DonationService } from './donation.service';
import { Donation } from './entities/donation.entity';
import { DonationStatus } from './enums/donation-status.enum';

const DONOR_ID = 'd461474b-a2a7-4b5b-bece-5db4afc1f4d0';
const PRODUCT_ID = '7995f153-f381-45e8-8b23-fedf0d0712fe';
const DONATION_ID = '41975b52-a291-42f4-a7bc-2323377e413f';

const donor = { id: DONOR_ID, fullName: 'Fundación Bolívar' } as Donor;
const product = { id: PRODUCT_ID, name: 'Suero oral' } as Product;

const buildDonation = (status = DonationStatus.RECIBIDA): Donation =>
  ({
    id: DONATION_ID,
    donor,
    product,
    quantity: 200,
    status,
    notes: null,
  }) as Donation;

describe('DonationService', () => {
  let service: DonationService;
  let repository: {
    findOne: jest.Mock;
    findAndCount: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let inventoryService: { increaseStock: jest.Mock; decreaseStock: jest.Mock };
  let donorService: { findOne: jest.Mock };
  let manager: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock };

  beforeEach(async () => {
    repository = {
      findOne: jest.fn().mockResolvedValue(buildDonation()),
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      createQueryBuilder: jest.fn(),
    };
    inventoryService = {
      increaseStock: jest.fn(),
      decreaseStock: jest.fn(),
    };
    donorService = { findOne: jest.fn().mockResolvedValue(donor) };
    manager = {
      findOne: jest.fn(),
      save: jest.fn((entity: Donation) =>
        Promise.resolve({ ...entity, id: DONATION_ID }),
      ),
      create: jest.fn((_entity: unknown, data: Partial<Donation>) => data),
    };
    const dataSource = {
      transaction: jest.fn((work: (m: EntityManager) => Promise<unknown>) =>
        work(manager as unknown as EntityManager),
      ),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        DonationService,
        { provide: getRepositoryToken(Donation), useValue: repository },
        { provide: InventoryService, useValue: inventoryService },
        { provide: DonorService, useValue: donorService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = moduleRef.get(DonationService);
  });

  describe('create', () => {
    const dto = { donorId: DONOR_ID, productId: PRODUCT_ID, quantity: 200 };

    it('guarda la donación y suma la cantidad al inventario', async () => {
      manager.findOne
        .mockResolvedValueOnce(donor)
        .mockResolvedValueOnce(product);

      const result = await service.create(dto);

      expect(manager.save).toHaveBeenCalled();
      expect(inventoryService.increaseStock).toHaveBeenCalledWith(
        manager,
        PRODUCT_ID,
        200,
      );
      expect(result.id).toBe(DONATION_ID);
    });

    it('lanza 404 si el donante no existe y no toca el inventario', async () => {
      manager.findOne.mockResolvedValueOnce(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      expect(inventoryService.increaseStock).not.toHaveBeenCalled();
    });

    it('lanza 404 si el producto no existe', async () => {
      manager.findOne.mockResolvedValueOnce(donor).mockResolvedValueOnce(null);

      await expect(service.create(dto)).rejects.toThrow(
        new NotFoundException(
          `No se encontró el producto con id ${PRODUCT_ID}`,
        ),
      );
      expect(manager.save).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('anula la donación y descuenta el stock', async () => {
      const donation = buildDonation();
      manager.findOne.mockResolvedValueOnce(donation);

      await service.cancel(DONATION_ID);

      expect(inventoryService.decreaseStock).toHaveBeenCalledWith(
        manager,
        PRODUCT_ID,
        200,
      );
      expect(donation.status).toBe(DonationStatus.ANULADA);
      expect(manager.save).toHaveBeenCalledWith(donation);
    });

    it('lanza 400 si la donación ya estaba anulada', async () => {
      manager.findOne.mockResolvedValueOnce(
        buildDonation(DonationStatus.ANULADA),
      );

      await expect(service.cancel(DONATION_ID)).rejects.toThrow(
        BadRequestException,
      );
      expect(inventoryService.decreaseStock).not.toHaveBeenCalled();
    });

    it('lanza 409 si el stock ya no alcanza y no cambia el estado', async () => {
      const donation = buildDonation();
      manager.findOne.mockResolvedValueOnce(donation);
      inventoryService.decreaseStock.mockRejectedValueOnce(
        new ConflictException(
          'Stock insuficiente: disponible 30, solicitado 200',
        ),
      );

      await expect(service.cancel(DONATION_ID)).rejects.toThrow(
        ConflictException,
      );
      expect(donation.status).toBe(DonationStatus.RECIBIDA);
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('lanza 404 si la donación no existe', async () => {
      manager.findOne.mockResolvedValueOnce(null);

      await expect(service.cancel(DONATION_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByDonor', () => {
    it('valida que el donante exista y filtra por él', async () => {
      await service.findByDonor(DONOR_ID, { page: 1, limit: 10 });

      expect(donorService.findOne).toHaveBeenCalledWith(DONOR_ID);
      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { donor: { id: DONOR_ID } } }),
      );
    });
  });

  describe('getDonorSummary', () => {
    const buildQueryBuilder = (row: Record<string, unknown> | undefined) => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue(row),
    });

    it('devuelve las donaciones y unidades donadas del donante', async () => {
      const lastDonationAt = new Date('2026-11-17T14:00:00Z');
      const queryBuilder = buildQueryBuilder({
        totalDonations: '5',
        receivedDonations: '4',
        cancelledDonations: '1',
        unitsDonated: '860',
        productsDonated: '3',
        lastDonationAt,
      });
      repository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.getDonorSummary(DONOR_ID);

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'donation.donor_id = :donorId',
        { donorId: DONOR_ID },
      );
      expect(result).toEqual({
        donorId: DONOR_ID,
        fullName: 'Fundación Bolívar',
        totalDonations: 5,
        receivedDonations: 4,
        cancelledDonations: 1,
        unitsDonated: 860,
        productsDonated: 3,
        lastDonationAt,
      });
    });

    it('devuelve ceros si el donante no tiene donaciones', async () => {
      repository.createQueryBuilder.mockReturnValue(
        buildQueryBuilder({
          totalDonations: '0',
          receivedDonations: '0',
          cancelledDonations: '0',
          unitsDonated: '0',
          productsDonated: '0',
          lastDonationAt: null,
        }),
      );

      const result = await service.getDonorSummary(DONOR_ID);

      expect(result.unitsDonated).toBe(0);
      expect(result.lastDonationAt).toBeNull();
    });

    it('lanza 404 si el donante no existe', async () => {
      donorService.findOne.mockRejectedValueOnce(
        new NotFoundException('No se encontró el donante'),
      );

      await expect(service.getDonorSummary(DONOR_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.createQueryBuilder).not.toHaveBeenCalled();
    });
  });
});
