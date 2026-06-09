import pg from 'pg';
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
}
