import pg from 'pg';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { config } from '../config/env.js';

// Локальная БД (localhost) работает без SSL; облачная (Render, Neon, Supabase) — требует SSL.
const isLocal = /@(localhost|127\.0\.0\.1)/.test(config.databaseUrl);

/** Пул соединений с PostgreSQL — единый на процесс. */
export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: isLocal ? undefined : { rejectUnauthorized: false },
});

/**
 * Создаёт таблицу организаций, если её ещё нет.
 * Баллы (k_scores) хранятся как JSONB — гибко и совпадает с JSON-контрактом API.
 */
export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orgs (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      k_scores   JSONB NOT NULL DEFAULT '{}'::jsonb
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // Миграция старых баз: колонка login → email (вход теперь по почте).
  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'login')
         AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') THEN
        ALTER TABLE users RENAME COLUMN login TO email;
      END IF;
    END $$;
  `);

  // Токены сброса пароля: в БД хранится только хеш токена, сырой — лишь в письме.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at    TIMESTAMPTZ
    );
  `);

  await seedAdmin();
}

/**
 * Создаёт администратора по умолчанию, если таблица пользователей пуста.
 * Почта/пароль берутся из переменных окружения (ADMIN_EMAIL/ADMIN_PASSWORD).
 */
async function seedAdmin(): Promise<void> {
  const { rows } = await pool.query<{ count: string }>('SELECT COUNT(*)::int AS count FROM users');
  if (Number(rows[0]?.count ?? 0) > 0) return;

  const passwordHash = await bcrypt.hash(config.adminPassword, 10);
  await pool.query(
    'INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)',
    [randomUUID(), config.adminEmail, passwordHash],
  );
  console.log(`Создан администратор по умолчанию: почта "${config.adminEmail}"`);
}
