import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { E2E_DATABASE } from './e2e-setup';

describe('Zonas afectadas y donantes (e2e)', () => {
  let app: INestApplication<App>;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('CRUD de zonas afectadas', () => {
    let zoneId: string;

    it('crea una zona', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/affected-zones')
        .send({
          name: 'Casco urbano de San Marcos',
          department: 'Sucre',
          municipality: 'San Marcos',
          emergencyType: 'INUNDACION',
          priority: 'CRITICA',
          affectedFamilies: 1250,
        })
        .expect(201);

      expect(response.body.isActive).toBe(true);
      zoneId = response.body.id;
    });

    it('rechaza un departamento que no existe', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/affected-zones')
        .send({
          name: 'Zona X',
          department: 'Gotham',
          municipality: 'X',
          emergencyType: 'SEQUIA',
          priority: 'ALTA',
          affectedFamilies: 3,
        })
        .expect(400);

      expect(response.body.path).toBe('/api/v1/affected-zones');
    });

    it('lista, busca y consulta la zona', async () => {
      const server = app.getHttpServer();

      const list = await request(server)
        .get('/api/v1/affected-zones?search=san%20marcos')
        .expect(200);
      expect(list.body.meta.total).toBe(1);

      await request(server).get(`/api/v1/affected-zones/${zoneId}`).expect(200);

      const stats = await request(server)
        .get('/api/v1/affected-zones/stats')
        .expect(200);
      expect(stats.body).toEqual([
        {
          department: 'Sucre',
          zones: 1,
          activeZones: 1,
          affectedFamilies: 1250,
        },
      ]);
    });

    it('actualiza, desactiva y elimina la zona', async () => {
      const server = app.getHttpServer();

      const patched = await request(server)
        .patch(`/api/v1/affected-zones/${zoneId}`)
        .send({ affectedFamilies: 1300 })
        .expect(200);
      expect(patched.body.affectedFamilies).toBe(1300);

      const replaced = await request(server)
        .put(`/api/v1/affected-zones/${zoneId}`)
        .send({
          name: 'Casco urbano de San Marcos',
          department: 'Sucre',
          municipality: 'San Marcos',
          emergencyType: 'INUNDACION',
          priority: 'ALTA',
          affectedFamilies: 900,
        })
        .expect(200);
      expect(replaced.body.priority).toBe('ALTA');

      const status = await request(server)
        .patch(`/api/v1/affected-zones/${zoneId}/status`)
        .send({ isActive: false })
        .expect(200);
      expect(status.body.isActive).toBe(false);

      await request(server)
        .delete(`/api/v1/affected-zones/${zoneId}`)
        .expect(204);
      await request(server).get(`/api/v1/affected-zones/${zoneId}`).expect(404);
    });
  });

  describe('CRUD de donantes', () => {
    const donor = {
      fullName: 'Carlos Andrés Mosquera Palacios',
      documentType: 'CC',
      documentNumber: '1077456123',
      email: 'carlos.mosquera@hotmail.com',
      phone: '3207654321',
      city: 'Quibdó',
      donorType: 'PERSONA_NATURAL',
    };
    let donorId: string;

    it('crea un donante y no permite repetir el documento', async () => {
      const server = app.getHttpServer();

      const created = await request(server)
        .post('/api/v1/donors')
        .send(donor)
        .expect(201);
      donorId = created.body.id;

      const duplicated = await request(server)
        .post('/api/v1/donors')
        .send({ ...donor, email: 'otro@correo.com' })
        .expect(409);
      expect(duplicated.body.message).toBe(
        'Ya existe un donante con el documento 1077456123',
      );
    });

    it('rechaza un celular que no empieza por 3', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/donors')
        .send({
          ...donor,
          documentNumber: '1077456124',
          email: 'otro@correo.com',
          phone: '6044445566',
        })
        .expect(400);
    });

    it('busca, consulta y actualiza el donante', async () => {
      const server = app.getHttpServer();

      const list = await request(server)
        .get('/api/v1/donors?search=mosquera')
        .expect(200);
      expect(list.body.meta.total).toBe(1);

      const patched = await request(server)
        .patch(`/api/v1/donors/${donorId}`)
        .send({ city: 'Medellín' })
        .expect(200);
      expect(patched.body.city).toBe('Medellín');

      const summary = await request(server)
        .get(`/api/v1/donors/${donorId}/summary`)
        .expect(200);
      expect(summary.body.totalDonations).toBe(0);
    });

    it('no elimina un donante con donaciones y sí uno sin donaciones', async () => {
      const server = app.getHttpServer();

      const product = await request(server)
        .post('/api/v1/products')
        .send({ name: 'Cobija térmica', category: 'COBIJAS', unit: 'UNIDAD' })
        .expect(201);
      await request(server)
        .post('/api/v1/donations')
        .send({ donorId, productId: product.body.id, quantity: 20 })
        .expect(201);

      const conflict = await request(server)
        .delete(`/api/v1/donors/${donorId}`)
        .expect(409);
      expect(conflict.body.message).toContain('tiene donaciones registradas');

      const other = await request(server)
        .post('/api/v1/donors')
        .send({
          ...donor,
          documentNumber: '43123456',
          email: 'sin.donaciones@gmail.com',
        })
        .expect(201);
      await request(server)
        .delete(`/api/v1/donors/${other.body.id}`)
        .expect(204);
    });
  });
});
