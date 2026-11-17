import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DonorService } from './donor.service';
import { CreateDonorDto } from './dto/create-donor.dto';
import { Donor } from './entities/donor.entity';
import { DocumentType } from './enums/document-type.enum';
import { DonorType } from './enums/donor-type.enum';

type MockRepository = Partial<Record<keyof Repository<Donor>, jest.Mock>>;

const createDto: CreateDonorDto = {
  fullName: 'María Fernanda Ospina',
  documentType: DocumentType.CC,
  documentNumber: '1020456789',
  email: 'maria.ospina@gmail.com',
  phone: '3104567890',
  city: 'Medellín',
  donorType: DonorType.PERSONA_NATURAL,
};

const buildDonor = (overrides: Partial<Donor> = {}): Donor =>
  ({
    id: 'd461474b-a2a7-4b5b-bece-5db4afc1f4d0',
    ...createDto,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as Donor;

describe('DonorService', () => {
  let service: DonorService;
  let repository: MockRepository;

  beforeEach(async () => {
    repository = {
      create: jest.fn((dto: CreateDonorDto) => ({ ...dto })),
      save: jest.fn((donor: Donor) => Promise.resolve(donor)),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      merge: jest.fn((donor: Donor, changes: Partial<Donor>) =>
        Object.assign(donor, changes),
      ),
      remove: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        DonorService,
        { provide: getRepositoryToken(Donor), useValue: repository },
      ],
    }).compile();

    service = moduleRef.get(DonorService);
  });

  describe('create', () => {
    it('registra un donante nuevo', async () => {
      repository.findOne?.mockResolvedValue(null);

      const result = await service.create(createDto);

      expect(repository.save).toHaveBeenCalled();
      expect(result.documentNumber).toBe('1020456789');
    });

    it('lanza 409 si el documento ya existe', async () => {
      repository.findOne?.mockResolvedValueOnce(buildDonor());

      await expect(service.create(createDto)).rejects.toThrow(
        new ConflictException(
          'Ya existe un donante con el documento 1020456789',
        ),
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('lanza 409 si el correo ya existe', async () => {
      repository.findOne
        ?.mockResolvedValueOnce(null)
        .mockResolvedValueOnce(buildDonor());

      await expect(service.create(createDto)).rejects.toThrow(
        new ConflictException(
          'Ya existe un donante con el correo maria.ospina@gmail.com',
        ),
      );
    });
  });

  describe('findAll', () => {
    it('busca por nombre, documento o correo dentro del tipo de donante', async () => {
      repository.findAndCount?.mockResolvedValue([[buildDonor()], 1]);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        search: 'ospina',
        donorType: DonorType.PERSONA_NATURAL,
      });

      const findAndCount = repository.findAndCount as jest.Mock;
      const [[options]] = findAndCount.mock.calls as [[{ where: object[] }]];
      expect(options.where).toHaveLength(3);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe('findOne', () => {
    it('lanza 404 si el donante no existe', async () => {
      repository.findOne?.mockResolvedValue(null);

      await expect(service.findOne('no-existe')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('actualiza el teléfono del donante', async () => {
      repository.findOne
        ?.mockResolvedValueOnce(buildDonor())
        .mockResolvedValue(null);

      const result = await service.update('id', { phone: '3001234567' });

      expect(result.phone).toBe('3001234567');
    });

    it('lanza 409 si el nuevo correo pertenece a otro donante', async () => {
      repository.findOne
        ?.mockResolvedValueOnce(buildDonor())
        .mockResolvedValueOnce(buildDonor({ id: 'otro' }));

      await expect(
        service.update('id', { email: 'otro@gmail.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('lanza 400 si el documento no coincide con el tipo', async () => {
      repository.findOne
        ?.mockResolvedValueOnce(buildDonor())
        .mockResolvedValue(null);

      await expect(
        service.update('id', { documentType: DocumentType.NIT }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('elimina un donante existente', async () => {
      const donor = buildDonor();
      repository.findOne?.mockResolvedValue(donor);

      await service.remove(donor.id);

      expect(repository.remove).toHaveBeenCalledWith(donor);
    });
  });
});
