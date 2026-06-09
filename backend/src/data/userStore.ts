import { pool } from './db.js';
import type { User } from '../types/index.js';

/** Строка таблицы users в том виде, в каком её возвращает pg. */
interface UserRow {
  id: string;
  login: string;
  password_hash: string;
  created_at: Date;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    login: row.login,
    passwordHash: row.password_hash,
    createdAt: row.created_at.toISOString(),
  };
}

/**
 * Хранилище пользователей в PostgreSQL.
 * Изолировано за этим модулем — сервисный слой не знает о деталях БД.
 */
export const userStore = {
  async findByLogin(login: string): Promise<User | undefined> {
    const { rows } = await pool.query<UserRow>(
      'SELECT id, login, password_hash, created_at FROM users WHERE login = $1',
      [login],
    );
    return rows[0] ? rowToUser(rows[0]) : undefined;
  },

  async get(id: string): Promise<User | undefined> {
    const { rows } = await pool.query<UserRow>(
      'SELECT id, login, password_hash, created_at FROM users WHERE id = $1',
      [id],
    );
    return rows[0] ? rowToUser(rows[0]) : undefined;
  },

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, id]);
  },

  async updateLogin(id: string, login: string): Promise<void> {
    await pool.query('UPDATE users SET login = $1 WHERE id = $2', [login, id]);
  },
};
