import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { E2E_DATABASE } from './e2e-setup';

describe('Productos, inventario y donaciones (e2e)', () => {
  let app: INestApplication<App>;
  let productId: string;
  let inventoryId: string;
  let donorId: string;

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

    const donor = await request(app.getHttpServer())
      .post('/api/v1/donors')
      .send({
        fullName: 'Fundación Manos Unidas por Colombia',
        documentType: 'NIT',
        documentNumber: '900123456-7',
        email: 'donaciones@manosunidas.org.co',
        phone: '3157778899',
        city: 'Bogotá',
        donorType: 'FUNDACION',
      })
      .expect(201);
    donorId = donor.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('productos', () => {
    it('crea productos con su inventario en 0 y los ordena', async () => {
      const server = app.getHttpServer();

      const created = await request(server)
        .post('/api/v1/products')
        .send({ name: 'Suero oral', category: 'MEDICAMENTOS', unit: 'UNIDAD' })
        .expect(201);
      productId = created.body.id;
      inventoryId = created.body.inventory.id;
      expect(created.body.inventory.availableQuantity).toBe(0);

      await request(server)
        .post('/api/v1/products')
        .send({
          name: 'Arroz blanco 1 kg',
          category: 'ALIMENTOS',
          unit: 'KILOGRAMO',
        })
        .expect(201);

      const byName = await request(server)
        .get('/api/v1/products?sort=name&order=DESC')
        .expect(200);
      expect(byName.body.data.map((p: { name: string }) => p.name)).toEqual([
        'Suero oral',
        'Arroz blanco 1 kg',
      ]);

      const outOfStock = await request(server)
        .get('/api/v1/products/out-of-stock')
        .expect(200);
      expect(outOfStock.body.meta.total).toBe(2);
    });

    it('no repite nombres y valida la categoría', async () => {
      const server = app.getHttpServer();

      await request(server)
        .post('/api/v1/products')
        .send({ name: 'SUERO ORAL', category: 'MEDICAMENTOS', unit: 'UNIDAD' })
        .expect(409);
      await request(server)
        .post('/api/v1/products')
        .send({ name: 'Juguetes', category: 'JUGUETES', unit: 'UNIDAD' })
        .expect(400);
    });
  });

  describe('inventario', () => {
    it('ajusta el stock con motivo y guarda el historial', async () => {
      const server = app.getHttpServer();

      const adjusted = await request(server)
        .patch(`/api/v1/inventory/${inventoryId}/adjust`)
        .send({ quantity: 40, reason: 'Conteo físico en bodega' })
        .expect(200);
      expect(adjusted.body.availableQuantity).toBe(40);

      const negative = await request(server)
        .patch(`/api/v1/inventory/${inventoryId}/adjust`)
        .send({ quantity: -100, reason: 'Producto vencido' })
        .expect(409);
      expect(negative.body.message).toBe(
        'Stock insuficiente: disponible 40, solicitado 100',
      );

      const history = await request(server)
        .get(`/api/v1/inventory/${inventoryId}/adjustments`)
        .expect(200);
      expect(history.body.meta.total).toBe(1);
      expect(history.body.data[0]).toMatchObject({
        quantity: 40,
        previousQuantity: 0,
        newQuantity: 40,
        reason: 'Conteo físico en bodega',
      });
    });

    it('muestra las alertas y las filtra por categoría', async () => {
      const server = app.getHttpServer();

      await request(server)
        .patch(`/api/v1/inventory/${inventoryId}/minimum-stock`)
        .send({ minimumStock: 60 })
        .expect(200);

      const alerts = await request(server)
        .get('/api/v1/inventory/alerts?category=MEDICAMENTOS')
        .expect(200);
      expect(alerts.body.meta.total).toBe(1);
      expect(alerts.body.data[0].product.name).toBe('Suero oral');

      const water = await request(server)
        .get('/api/v1/inventory/alerts?category=AGUA')
        .expect(200);
      expect(water.body.meta.total).toBe(0);
    });
  });

  describe('donaciones', () => {
    it('registra una donación y suma al inventario', async () => {
      const server = app.getHttpServer();

      const donation = await request(server)
        .post('/api/v1/donations')
        .send({ donorId, productId, quantity: 200 })
        .expect(201);
      expect(donation.body.status).toBe('RECIBIDA');

      const inventory = await request(server)
        .get(`/api/v1/inventory/product/${productId}`)
        .expect(200);
      expect(inventory.body.availableQuantity).toBe(240);

      const recent = await request(server)
        .get('/api/v1/donations/recent')
        .expect(200);
      expect(recent.body).toHaveLength(1);

      const today = await request(server)
        .get('/api/v1/donations?from=2026-01-01')
        .expect(200);
      expect(today.body.meta.total).toBe(1);
    });

    it('anula la donación, descuenta el stock y no deja anularla dos veces', async () => {
      const server = app.getHttpServer();
      const donation = await request(server)
        .post('/api/v1/donations')
        .send({ donorId, productId, quantity: 30 })
        .expect(201);

      const cancelled = await request(server)
        .patch(`/api/v1/donations/${donation.body.id}/cancel`)
        .expect(200);
      expect(cancelled.body.status).toBe('ANULADA');

      const inventory = await request(server)
        .get(`/api/v1/inventory/product/${productId}`)
        .expect(200);
      expect(inventory.body.availableQuantity).toBe(240);

      await request(server)
        .patch(`/api/v1/donations/${donation.body.id}/cancel`)
        .expect(400);
    });

    it('rechaza donaciones de más de 10.000 unidades y productos que no existen', async () => {
      const server = app.getHttpServer();

      await request(server)
        .post('/api/v1/donations')
        .send({ donorId, productId, quantity: 10001 })
        .expect(400);
      await request(server)
        .post('/api/v1/donations')
        .send({
          donorId,
          productId: '6f1c2b8e-3d4a-4c9b-9f0e-1a2b3c4d5e6f',
          quantity: 5,
        })
        .expect(404);
    });

    it('no deja eliminar un producto que tiene donaciones', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/products/${productId}`)
        .expect(409);
      expect(response.body.message).toBe(
        'No se puede eliminar "Suero oral" porque tiene donaciones o entregas registradas',
      );
    });
  });
});
