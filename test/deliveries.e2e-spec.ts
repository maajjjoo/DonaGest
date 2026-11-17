import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { addDays, getTodayInColombia } from '../src/common/helpers/date.helper';
import { E2E_DATABASE } from './e2e-setup';

describe('Flujo completo de una entrega (e2e)', () => {
  let app: INestApplication<App>;
  let zoneId: string;
  let productId: string;
  const today = getTodayInColombia();

  const stock = async (): Promise<number> => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/inventory/product/${productId}`)
      .expect(200);
    return response.body.availableQuantity as number;
  };

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
    const zone = await request(server)
      .post('/api/v1/affected-zones')
      .send({
        name: 'Comunidades wayuu de Uribia',
        department: 'La Guajira',
        municipality: 'Uribia',
        emergencyType: 'SEQUIA',
        priority: 'ALTA',
        affectedFamilies: 860,
      })
      .expect(201);
    zoneId = zone.body.id;

    const product = await request(server)
      .post('/api/v1/products')
      .send({
        name: 'Agua potable en bolsa 6 L',
        category: 'AGUA',
        unit: 'PAQUETE',
      })
      .expect(201);
    productId = product.body.id;

    const donor = await request(server)
      .post('/api/v1/donors')
      .send({
        fullName: 'Distribuidora La Esperanza S.A.S.',
        documentType: 'NIT',
        documentNumber: '901234567-1',
        email: 'responsabilidad@laesperanza.com.co',
        phone: '3186543210',
        city: 'Barranquilla',
        donorType: 'EMPRESA',
      })
      .expect(201);

    await request(server)
      .post('/api/v1/donations')
      .send({ donorId: donor.body.id, productId, quantity: 500 })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  it('programa, reprograma, despacha y entrega descontando el stock una sola vez', async () => {
    const server = app.getHttpServer();

    const created = await request(server)
      .post('/api/v1/deliveries')
      .send({
        affectedZoneId: zoneId,
        productId,
        quantity: 200,
        scheduledDate: addDays(today, 1),
        notes: 'Entrega en carrotanque a las rancherías',
      })
      .expect(201);
    const deliveryId = created.body.id as string;
    expect(created.body.status).toBe('PROGRAMADA');
    expect(await stock()).toBe(300);

    const upcoming = await request(server)
      .get('/api/v1/deliveries/upcoming')
      .expect(200);
    expect(upcoming.body).toHaveLength(1);

    const rescheduled = await request(server)
      .patch(`/api/v1/deliveries/${deliveryId}/reschedule`)
      .send({ scheduledDate: addDays(today, 3) })
      .expect(200);
    expect(rescheduled.body.scheduledDate).toBe(addDays(today, 3));

    const notes = await request(server)
      .patch(`/api/v1/deliveries/${deliveryId}/notes`)
      .send({ notes: 'Se coordinó con la autoridad indígena' })
      .expect(200);
    expect(notes.body.notes).toBe('Se coordinó con la autoridad indígena');

    await request(server)
      .patch(`/api/v1/deliveries/${deliveryId}/status`)
      .send({ status: 'ENTREGADA' })
      .expect(400);

    await request(server)
      .patch(`/api/v1/deliveries/${deliveryId}/status`)
      .send({ status: 'EN_TRANSITO' })
      .expect(200);

    await request(server)
      .patch(`/api/v1/deliveries/${deliveryId}/reschedule`)
      .send({ scheduledDate: addDays(today, 5) })
      .expect(400);

    const delivered = await request(server)
      .patch(`/api/v1/deliveries/${deliveryId}/status`)
      .send({ status: 'ENTREGADA' })
      .expect(200);
    expect(delivered.body.deliveredAt).not.toBeNull();
    expect(await stock()).toBe(300);

    const zoneDeliveries = await request(server)
      .get(`/api/v1/affected-zones/${zoneId}/deliveries`)
      .expect(200);
    expect(zoneDeliveries.body.meta.total).toBe(1);
  });

  it('cancela una entrega y devuelve el stock', async () => {
    const server = app.getHttpServer();

    const created = await request(server)
      .post('/api/v1/deliveries')
      .send({
        affectedZoneId: zoneId,
        productId,
        quantity: 100,
        scheduledDate: today,
      })
      .expect(201);
    expect(await stock()).toBe(200);

    await request(server)
      .patch(`/api/v1/deliveries/${created.body.id}/status`)
      .send({ status: 'CANCELADA' })
      .expect(200);
    expect(await stock()).toBe(300);
  });

  it('muestra como vencida una entrega programada con fecha pasada', async () => {
    const server = app.getHttpServer();
    const created = await request(server)
      .post('/api/v1/deliveries')
      .send({
        affectedZoneId: zoneId,
        productId,
        quantity: 10,
        scheduledDate: today,
      })
      .expect(201);

    await app
      .get(DataSource)
      .query('UPDATE deliveries SET scheduled_date = $1 WHERE id = $2', [
        addDays(today, -2),
        created.body.id,
      ]);

    const overdue = await request(server)
      .get('/api/v1/deliveries/overdue')
      .expect(200);
    expect(overdue.body).toHaveLength(1);
    expect(overdue.body[0].id).toBe(created.body.id);
  });

  it('rechaza fechas pasadas, falta de stock y zonas inactivas', async () => {
    const server = app.getHttpServer();

    await request(server)
      .post('/api/v1/deliveries')
      .send({
        affectedZoneId: zoneId,
        productId,
        quantity: 5,
        scheduledDate: addDays(today, -1),
      })
      .expect(400);

    const noStock = await request(server)
      .post('/api/v1/deliveries')
      .send({
        affectedZoneId: zoneId,
        productId,
        quantity: 99999,
        scheduledDate: today,
      })
      .expect(409);
    expect(noStock.body.message).toMatch(/^Stock insuficiente/);

    await request(server)
      .patch(`/api/v1/affected-zones/${zoneId}/status`)
      .send({ isActive: false })
      .expect(200);
    await request(server)
      .post('/api/v1/deliveries')
      .send({
        affectedZoneId: zoneId,
        productId,
        quantity: 5,
        scheduledDate: today,
      })
      .expect(400);
  });
});
