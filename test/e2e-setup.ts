import { existsSync } from 'node:fs';
import { Client } from 'pg';

export const E2E_DATABASE = 'donagest_e2e';

export default async function globalSetup(): Promise<void> {
  if (existsSync('.env')) {
    process.loadEnvFile('.env');
  }

  const client = new Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: 'postgres',
  });

  await client.connect();
  try {
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [E2E_DATABASE],
    );
    if (result.rowCount === 0) {
      await client.query(`CREATE DATABASE ${E2E_DATABASE}`);
    }
  } finally {
    await client.end();
  }
}
