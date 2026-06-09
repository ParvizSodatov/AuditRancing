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
      login         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await seedAdmin();
}

/**
 * Создаёт администратора по умолчанию, если таблица пользователей пуста.
 * Логин/пароль берутся из переменных окружения (ADMIN_LOGIN/ADMIN_PASSWORD).
 */
async function seedAdmin(): Promise<void> {
  const { rows } = await pool.query<{ count: string }>('SELECT COUNT(*)::int AS count FROM users');
  if (Number(rows[0]?.count ?? 0) > 0) return;

  const passwordHash = await bcrypt.hash(config.adminPassword, 10);
  await pool.query(
    'INSERT INTO users (id, login, password_hash) VALUES ($1, $2, $3)',
    [randomUUID(), config.adminLogin, passwordHash],
  );
  console.log(`Создан администратор по умолчанию: логин "${config.adminLogin}"`);
}
