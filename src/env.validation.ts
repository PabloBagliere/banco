import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test', 'provision']),
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(64),
  REDIS_HOST: z.string().min(8),
  DAILY_LIMIT_ARS: z.coerce.number().int().min(0),
  PORT: z.coerce.number().int().min(0).max(65535),
});

export const validate = (config: Record<string, unknown>) =>
  envSchema.parse(config);
