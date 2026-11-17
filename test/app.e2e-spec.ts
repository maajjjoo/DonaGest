import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { E2E_DATABASE } from './e2e-setup';

describe('DonaGest API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.DB_NAME = E2E_DATABASE;
    process.env.DB_SYNCHRONIZE = 'true';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    await app.get(DataSource).synchronize(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health responde que la API y la base están arriba', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(response.body).toMatchObject({ status: 'ok', database: 'up' });
    expect(typeof response.body.timestamp).toBe('string');
  });

  it('crear producto, donar y consultar el inventario', async () => {
    const server = app.getHttpServer();

    const product = await request(server)
      .post('/api/v1/products')
      .send({
        name: 'Agua potable en bolsa 6 L',
        category: 'AGUA',
        unit: 'PAQUETE',
      })
      .expect(201);
    expect(product.body.inventory.availableQuantity).toBe(0);

    const donor = await request(server)
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
      .expect(201);

    const donation = await request(server)
      .post('/api/v1/donations')
      .send({
        donorId: donor.body.id,
        productId: product.body.id,
        quantity: 250,
      })
      .expect(201);
    expect(donation.body.status).toBe('RECIBIDA');

    const inventory = await request(server)
      .get(`/api/v1/inventory/product/${product.body.id}`)
      .expect(200);
    expect(inventory.body.availableQuantity).toBe(250);

    await request(server)
      .patch(`/api/v1/donations/${donation.body.id}/cancel`)
      .expect(200);

    const afterCancel = await request(server)
      .get(`/api/v1/inventory/product/${product.body.id}`)
      .expect(200);
    expect(afterCancel.body.availableQuantity).toBe(0);
  });

  it('responde con los errores esperados', async () => {
    const server = app.getHttpServer();

    await request(server)
      .post('/api/v1/products')
      .send({ name: '', category: 'JUGUETES', unit: 'UNIDAD' })
      .expect(400);

    await request(server)
      .get('/api/v1/products/6f1c2b8e-3d4a-4c9b-9f0e-1a2b3c4d5e6f')
      .expect(404);

    await request(server)
      .post('/api/v1/products')
      .send({
        name: 'AGUA POTABLE EN BOLSA 6 L',
        category: 'AGUA',
        unit: 'PAQUETE',
      })
      .expect(409);
  });
});
