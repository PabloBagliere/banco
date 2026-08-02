import { DataSource } from 'typeorm';
import { InitAuth1785103149617 } from '../src/infrastructure/database/migrations/1785103149617-InitAuth';
import { UserRoleEnum1785120437595 } from '../src/infrastructure/database/migrations/1785120437595-UserRoleEnum';
import { RefreshToken1785122484261 } from '../src/infrastructure/database/migrations/1785122484261-RefreshToken';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for e2e tests.');
}

export const e2eDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  migrations: [InitAuth1785103149617, RefreshToken1785122484261, UserRoleEnum1785120437595],
});

export async function prepareE2eDatabase(): Promise<void> {
  await e2eDataSource.initialize();
  await e2eDataSource.runMigrations();
}

export async function cleanE2eDatabase(): Promise<void> {
  const tables = await e2eDataSource.query<{ tablename: string }[]>(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != 'migrations'",
  );
  if (tables.length === 0) {
    return;
  }

  const identifiers = tables.map(({ tablename }) => `"${tablename.replaceAll('"', '""')}"`).join(', ');
  await e2eDataSource.query(`TRUNCATE TABLE ${identifiers} RESTART IDENTITY CASCADE`);
}
