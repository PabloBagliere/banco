import ms, { type StringValue } from 'ms';
import { z } from 'zod';

// Duración válida para la librería `ms` ("15m", "1h", "7d"). Sin este refine
// cualquier string pasaba el boot y explotaba recién en el primer uso
// (ms() devuelve undefined → new Date(NaN) / expiresIn inválido → 500).
const msDuration = z.custom<StringValue>(
  (v) => typeof v === 'string' && Number.isFinite(ms(v as StringValue)),
  'Formato de duración inválido (ejemplos: "15m", "1h", "7d")',
);

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
  JWT_ACCESS_EXPIRES_IN: msDuration,
  JWT_REFRESH_EXPIRES_IN: msDuration,
  DAILY_LIMIT_STANDARD_ARS: z.coerce.number().int().min(0),
  DAILY_LIMIT_PREMIUM_ARS: z.coerce.number().int().min(0),
  TRANSFER_FEE_STANDARD_ARS: z.coerce.number().int().min(0),
  REVERSAL_WINDOW_HOURS: z.coerce.number().int().min(0),
  FRAUD_MAX_TRANSFERS_PER_WINDOW: z.coerce.number().int().min(0),
  FRAUD_WINDOW_MINUTES: z.coerce.number().int().min(0),
  FX_RATE_ARS_USD: z.coerce.number().int().min(0),
  RESEND_API_KEY: z.string().min(1),
  APP_DOMAIN: z.url(),
  EMAIL_FROM: z.email(),
});

export type Environment = z.infer<typeof envSchema>;

export const validate = (config: Record<string, unknown>) => {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return result.data;
};
