import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AffectedZoneService } from './affected-zone.service';
import { CreateAffectedZoneDto } from './dto/create-affected-zone.dto';
import { AffectedZone } from './entities/affected-zone.entity';
import { ColombianDepartment } from './enums/colombian-department.enum';
import { EmergencyType } from './enums/emergency-type.enum';
import { ZonePriority } from './enums/zone-priority.enum';

type MockRepository = Partial<
  Record<keyof Repository<AffectedZone>, jest.Mock>
>;

const buildZone = (overrides: Partial<AffectedZone> = {}): AffectedZone =>
  ({
    id: '7dbfe568-b4cd-43a3-831c-4fec8b61a8e2',
    name: 'Vereda Las Flores',
    department: ColombianDepartment.SUCRE,
    municipality: 'San Marcos',
    emergencyType: EmergencyType.INUNDACION,
    priority: ZonePriority.CRITICA,
    affectedFamilies: 320,
    description: 'Desbordamiento del río San Jorge',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as AffectedZone;

describe('AffectedZoneService', () => {
  let service: AffectedZoneService;
  let repository: MockRepository;

  beforeEach(async () => {
    repository = {
      create: jest.fn((dto: CreateAffectedZoneDto) => ({ ...dto })),
      save: jest.fn((zone: AffectedZone) => Promise.resolve(zone)),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      merge: jest.fn((zone: AffectedZone, changes: Partial<AffectedZone>) =>
        Object.assign(zone, changes),
      ),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AffectedZoneService,
        { provide: getRepositoryToken(AffectedZone), useValue: repository },
      ],
    }).compile();

    service = moduleRef.get(AffectedZoneService);
  });

  it('crea una zona afectada', async () => {
    const dto: CreateAffectedZoneDto = {
      name: 'Uribia centro',
      department: ColombianDepartment.LA_GUAJIRA,
      municipality: 'Uribia',
      emergencyType: EmergencyType.SEQUIA,
      priority: ZonePriority.ALTA,
      affectedFamilies: 210,
    };

    const result = await service.create(dto);

    expect(repository.create).toHaveBeenCalledWith(dto);
    expect(repository.save).toHaveBeenCalled();
    expect(result.name).toBe('Uribia centro');
  });

  it('lista con paginación, filtros y orden por prioridad', async () => {
    const zones = [buildZone()];
    repository.findAndCount?.mockResolvedValue([zones, 11]);

    const result = await service.findAll({
      page: 2,
      limit: 5,
      priority: ZonePriority.CRITICA,
      isActive: true,
    });

    expect(repository.findAndCount).toHaveBeenCalledWith({
      where: { priority: ZonePriority.CRITICA, isActive: true },
      order: { priority: 'DESC', affectedFamilies: 'DESC', createdAt: 'DESC' },
      skip: 5,
      take: 5,
    });
    expect(result).toEqual({
      data: zones,
      meta: { total: 11, page: 2, limit: 5, totalPages: 3 },
    });
  });

  it('busca por nombre o municipio sin perder los demás filtros', async () => {
    repository.findAndCount?.mockResolvedValue([[buildZone()], 1]);

    await service.findAll({
      page: 1,
      limit: 10,
      search: 'san marcos',
      department: ColombianDepartment.SUCRE,
    });

    const findAndCount = repository.findAndCount as jest.Mock;
    const [[options]] = findAndCount.mock.calls as [
      [{ where: Record<string, unknown>[] }],
    ];
    expect(options.where).toHaveLength(2);
    expect(options.where[0]).toMatchObject({
      department: ColombianDepartment.SUCRE,
    });
    expect(options.where[0]).toHaveProperty('name');
    expect(options.where[1]).toHaveProperty('municipality');
  });

  it('escapa los comodines de la búsqueda', async () => {
    repository.findAndCount?.mockResolvedValue([[], 0]);

    await service.findAll({ page: 1, limit: 10, search: '100%_seguro' });

    const findAndCount = repository.findAndCount as jest.Mock;
    const [[options]] = findAndCount.mock.calls as [
      [{ where: { name: { value: string } }[] }],
    ];
    expect(options.where[0].name.value).toBe('%100\\%\\_seguro%');
  });

  it('devuelve la zona cuando existe', async () => {
    const zone = buildZone();
    repository.findOne?.mockResolvedValue(zone);

    await expect(service.findOne(zone.id)).resolves.toBe(zone);
  });

  it('lanza NotFoundException cuando la zona no existe', async () => {
    repository.findOne?.mockResolvedValue(null);

    await expect(service.findOne('no-existe')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('al reemplazar con PUT vuelve a los valores por defecto', async () => {
    const zone = buildZone({ isActive: false });
    repository.findOne?.mockResolvedValue(zone);

    const result = await service.replace(zone.id, {
      name: 'Barrio El Carmen',
      department: ColombianDepartment.SUCRE,
      municipality: 'San Marcos',
      emergencyType: EmergencyType.INUNDACION,
      priority: ZonePriority.MEDIA,
      affectedFamilies: 120,
    });

    expect(result.description).toBeNull();
    expect(result.isActive).toBe(true);
    expect(result.priority).toBe(ZonePriority.MEDIA);
  });

  it('actualiza solo los campos enviados con PATCH', async () => {
    const zone = buildZone();
    repository.findOne?.mockResolvedValue(zone);

    const result = await service.update(zone.id, { affectedFamilies: 400 });

    expect(result.affectedFamilies).toBe(400);
    expect(result.name).toBe('Vereda Las Flores');
  });

  it('cambia el estado de la zona', async () => {
    const zone = buildZone();
    repository.findOne?.mockResolvedValue(zone);

    const result = await service.updateStatus(zone.id, { isActive: false });

    expect(result.isActive).toBe(false);
  });

  it('elimina una zona existente', async () => {
    const zone = buildZone();
    repository.findOne?.mockResolvedValue(zone);

    await service.remove(zone.id);

    expect(repository.remove).toHaveBeenCalledWith(zone);
  });

  it('no elimina si la zona no existe', async () => {
    repository.findOne?.mockResolvedValue(null);

    await expect(service.remove('no-existe')).rejects.toThrow(
      NotFoundException,
    );
    expect(repository.remove).not.toHaveBeenCalled();
  });

  it('agrupa zonas y familias por departamento y convierte a número', async () => {
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          department: ColombianDepartment.SUCRE,
          zones: '2',
          activeZones: '1',
          affectedFamilies: '1570',
        },
        {
          department: ColombianDepartment.CHOCO,
          zones: '1',
          activeZones: '1',
          affectedFamilies: '430',
        },
      ]),
    };
    repository.createQueryBuilder?.mockReturnValue(queryBuilder);

    const result = await service.getStatsByDepartment();

    expect(queryBuilder.groupBy).toHaveBeenCalledWith('zone.department');
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      '"affectedFamilies"',
      'DESC',
    );
    expect(result).toEqual([
      {
        department: ColombianDepartment.SUCRE,
        zones: 2,
        activeZones: 1,
        affectedFamilies: 1570,
      },
      {
        department: ColombianDepartment.CHOCO,
        zones: 1,
        activeZones: 1,
        affectedFamilies: 430,
      },
    ]);
  });

  it('devuelve una lista vacía si no hay zonas', async () => {
    repository.createQueryBuilder?.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    });

    await expect(service.getStatsByDepartment()).resolves.toEqual([]);
  });
});
