import 'dotenv/config';

/** Конфигурация приложения, собранная из переменных окружения. */
export const config = {
  port: Number(process.env.PORT) || 4000,
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  /** Строка подключения к PostgreSQL. */
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/auditrank',
} as const;
