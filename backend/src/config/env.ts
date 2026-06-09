import 'dotenv/config';

/** Конфигурация приложения, собранная из переменных окружения. */
export const config = {
  port: Number(process.env.PORT) || 4000,
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  /** Строка подключения к PostgreSQL. */
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/auditrank',
  /** Секрет для подписи JWT. В продакшене обязательно задать через переменную окружения. */
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  /** Срок жизни токена. */
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  /** Учётка администратора по умолчанию — создаётся при первом запуске, если пользователей нет. */
  adminLogin: process.env.ADMIN_LOGIN ?? 'admin',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'admin123',
} as const;
