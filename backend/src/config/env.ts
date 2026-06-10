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
  adminEmail: process.env.ADMIN_EMAIL ?? 'admin@example.com',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'admin123',
  /** Базовый адрес фронтенда — на него ведёт ссылка сброса пароля из письма. */
  appUrl: (process.env.APP_URL ?? 'http://localhost:5173').replace(/\/$/, ''),
  /** Сколько минут живёт ссылка для сброса пароля. */
  resetTokenTtlMinutes: Number(process.env.RESET_TOKEN_TTL_MINUTES) || 30,
  /** API-ключ Resend для отправки писем. Если пуст — ссылка печатается в консоль. */
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  /** Адрес отправителя писем (должен быть подтверждён в Resend). */
  mailFrom: process.env.MAIL_FROM ?? 'AuditRank <onboarding@resend.dev>',
} as const;
