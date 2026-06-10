import { pool } from './db.js';
import type { PasswordResetToken, User } from '../types/index.js';

/** Строка таблицы users в том виде, в каком её возвращает pg. */
interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at.toISOString(),
  };
}

/**
 * Хранилище пользователей в PostgreSQL.
 * Изолировано за этим модулем — сервисный слой не знает о деталях БД.
 */
export const userStore = {
  async findByEmail(email: string): Promise<User | undefined> {
    const { rows } = await pool.query<UserRow>(
      // Почту сравниваем без учёта регистра — Foo@x.ru и foo@x.ru это один адрес.
      'SELECT id, email, password_hash, created_at FROM users WHERE lower(email) = lower($1)',
      [email],
    );
    return rows[0] ? rowToUser(rows[0]) : undefined;
  },

  async get(id: string): Promise<User | undefined> {
    const { rows } = await pool.query<UserRow>(
      'SELECT id, email, password_hash, created_at FROM users WHERE id = $1',
      [id],
    );
    return rows[0] ? rowToUser(rows[0]) : undefined;
  },

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, id]);
  },

  async updateEmail(id: string, email: string): Promise<void> {
    await pool.query('UPDATE users SET email = $1 WHERE id = $2', [email, id]);
  },
};

/** Строка таблицы password_reset_tokens. */
interface ResetTokenRow {
  token_hash: string;
  user_id: string;
  expires_at: Date;
  used_at: Date | null;
}

function rowToResetToken(row: ResetTokenRow): PasswordResetToken {
  return {
    tokenHash: row.token_hash,
    userId: row.user_id,
    expiresAt: row.expires_at.toISOString(),
    usedAt: row.used_at ? row.used_at.toISOString() : null,
  };
}

/** Хранилище одноразовых токенов сброса пароля. */
export const resetTokenStore = {
  /** Создаёт токен. Заодно гасит прежние неиспользованные токены пользователя. */
  async create(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await pool.query(
      'UPDATE password_reset_tokens SET used_at = now() WHERE user_id = $1 AND used_at IS NULL',
      [userId],
    );
    await pool.query(
      'INSERT INTO password_reset_tokens (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
      [tokenHash, userId, expiresAt],
    );
  },

  async findByHash(tokenHash: string): Promise<PasswordResetToken | undefined> {
    const { rows } = await pool.query<ResetTokenRow>(
      'SELECT token_hash, user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = $1',
      [tokenHash],
    );
    return rows[0] ? rowToResetToken(rows[0]) : undefined;
  },

  async markUsed(tokenHash: string): Promise<void> {
    await pool.query(
      'UPDATE password_reset_tokens SET used_at = now() WHERE token_hash = $1',
      [tokenHash],
    );
  },
};
