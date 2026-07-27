import { DataSource } from 'typeorm';

// DataSource standalone: lo usa ÚNICAMENTE el CLI de TypeORM
// (migration:generate/run/revert/show). La app Nest se configura
// aparte en app.module.ts con AppConfig.
// loadEnvFile lee el .env (Node >= 20.12); si no existe, se usan
// las variables de entorno del sistema (prod).
try {
  process.loadEnvFile();
} catch {
  // no hay .env en este entorno
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['src/modules/**/*.entity.ts'],
  migrations: ['src/infrastructure/database/migrations/*.ts'],
});
