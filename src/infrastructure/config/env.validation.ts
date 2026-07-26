import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB: z.string(),
  POSTGRES_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
  DATABASE_URL: z.url(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
  JWT_ACCESS_SECRET: z.string().min(64),
  JWT_REFRESH_SECRET: z.string().min(64),
  JWT_ACCESS_EXPIRES_IN: z.string(),
  JWT_REFRESH_EXPIRES_IN: z.string(),
  DAILY_LIMIT_STANDARD_ARS: z.coerce.number().int().min(0),
  DAILY_LIMIT_PREMIUM_ARS: z.coerce.number().int().min(0),
  TRANSFER_FEE_STANDARD_ARS: z.coerce.number().int().min(0),
  REVERSAL_WINDOW_HOURS: z.coerce.number().int().min(0),
  FRAUD_MAX_TRANSFERS_PER_WINDOW: z.coerce.number().int().min(0),
  FRAUD_WINDOW_MINUTES: z.coerce.number().int().min(0),
  FX_RATE_ARS_USD: z.coerce.number().int().min(0),
});

export type Environment = z.infer<typeof envSchema>;

export const validate = (config: Record<string, unknown>) => {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Variables de entorno inválidas:\n${issues}`);
  }
  return result.data;
};
