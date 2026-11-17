import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { getTodayInColombia } from '../src/common/helpers/date.helper';
import { E2E_DATABASE } from './e2e-setup';

describe('Reportes (e2e)', () => {
  let app: INestApplication<App>;
  let sanMarcosId: string;
  const today = getTodayInColombia();

  beforeAll(async () => {
    process.env.DB_NAME = E2E_DATABASE;
    process.env.DB_SYNCHRONIZE = 'true';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
    await app.get(DataSource).synchronize(true);

    const server = app.getHttpServer();
    const createZone = async (body: Record<string, unknown>) =>
      (
        await request(server)
          .post('/api/v1/affected-zones')
          .send(body)
          .expect(201)
      ).body.id as string;

    sanMarcosId = await createZone({
      name: 'Casco urbano de San Marcos',
      department: 'Sucre',
      municipality: 'San Marcos',
      emergencyType: 'INUNDACION',
      priority: 'CRITICA',
      affectedFamilies: 1250,
    });
    await createZone({
      name: 'Albergue temporal de Quibdó',
      department: 'Chocó',
      municipality: 'Quibdó',
      emergencyType: 'DESPLAZAMIENTO',
      priority: 'ALTA',
      affectedFamilies: 430,
    });

    const donor = (
      await request(server)
        .post('/api/v1/donors')
        .send({
          fullName: 'María Fernanda Ospina Restrepo',
          documentType: 'CC',
          documentNumber: '1020456789',
          email: 'maria.ospina@gmail.com',
          phone: '3104567890',
          city: 'Medellín',
          donorType: 'PERSONA_NATURAL',
        })
        .expect(201)
    ).body.id as string;

    const water = (
      await request(server)
        .post('/api/v1/products')
        .send({
          name: 'Agua potable en bolsa 6 L',
          category: 'AGUA',
          unit: 'PAQUETE',
        })
        .expect(201)
    ).body.id as string;
    await request(server)
      .post('/api/v1/products')
      .send({ name: 'Cobija térmica', category: 'COBIJAS', unit: 'UNIDAD' })
      .expect(201);

    await request(server)
      .post('/api/v1/donations')
      .send({ donorId: donor, productId: water, quantity: 500 })
      .expect(201);
    const cancelled = await request(server)
      .post('/api/v1/donations')
      .send({ donorId: donor, productId: water, quantity: 50 })
      .expect(201);
    await request(server)
      .patch(`/api/v1/donations/${cancelled.body.id}/cancel`)
      .expect(200);

    const delivery = await request(server)
      .post('/api/v1/deliveries')
      .send({
        affectedZoneId: sanMarcosId,
        productId: water,
        quantity: 300,
        scheduledDate: today,
      })
      .expect(201);
    for (const status of ['EN_TRANSITO', 'ENTREGADA']) {
      await request(server)
        .patch(`/api/v1/deliveries/${delivery.body.id}/status`)
        .send({ status })
        .expect(200);
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /reports/summary resume toda la operación', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/reports/summary')
      .expect(200);

    expect(response.body).toMatchObject({
      donors: { total: 1 },
      donations: { received: 1, cancelled: 1, unitsDonated: 500 },
      deliveries: { ENTREGADA: 1, total: 1 },
      activeZonesByPriority: { CRITICA: 1, ALTA: 1, total: 2 },
      productsInAlert: 1,
    });
  });

  it('GET /reports/zones/:id muestra lo entregado en la zona', async () => {
    const server = app.getHttpServer();
    const response = await request(server)
      .get(`/api/v1/reports/zones/${sanMarcosId}`)
      .expect(200);

    expect(response.body.totalUnitsDelivered).toBe(300);
    expect(response.body.deliveredProducts[0].productName).toBe(
      'Agua potable en bolsa 6 L',
    );

    await request(server)
      .get('/api/v1/reports/zones/6f1c2b8e-3d4a-4c9b-9f0e-1a2b3c4d5e6f')
      .expect(404);
  });

  it('GET /reports/top-donors no cuenta las donaciones anuladas', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/reports/top-donors')
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      fullName: 'María Fernanda Ospina Restrepo',
      unitsDonated: 500,
      donationsCount: 1,
    });
  });

  it('GET /reports/inventory-by-category incluye todas las categorías', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/reports/inventory-by-category')
      .expect(200);

    expect(response.body).toHaveLength(7);
    const water = response.body.find(
      (item: { category: string }) => item.category === 'AGUA',
    );
    expect(water).toMatchObject({ productsCount: 1, availableUnits: 200 });
  });

  it('GET /reports/zones-without-deliveries muestra solo Quibdó', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/reports/zones-without-deliveries')
      .expect(200);

    expect(response.body.map((zone: { name: string }) => zone.name)).toEqual([
      'Albergue temporal de Quibdó',
    ]);
  });

  it('GET /reports/deliveries-by-department agrupa por departamento', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/reports/deliveries-by-department')
      .expect(200);

    expect(response.body).toEqual([
      {
        department: 'Sucre',
        totalDeliveries: 1,
        pendingDeliveries: 0,
        completedDeliveries: 1,
        cancelledDeliveries: 0,
        unitsDelivered: 300,
      },
    ]);
  });

  it('GET /reports/donations-by-month cuenta las donaciones del mes actual', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/reports/donations-by-month')
      .expect(200);

    expect(response.body).toEqual([
      {
        month: today.slice(0, 7),
        receivedDonations: 1,
        cancelledDonations: 1,
        unitsDonated: 500,
        donors: 1,
      },
    ]);
  });

  it('GET /health incluye la versión y el tiempo en línea', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      database: 'up',
      version: '1.1.0',
    });
    expect(typeof response.body.uptime).toBe('number');
  });
});
