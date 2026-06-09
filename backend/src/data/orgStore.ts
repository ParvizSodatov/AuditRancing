import { pool } from './db.js';
import { DEFAULT_SCORES, type AuditOrg, type OrgKScores } from '../types/index.js';

/** Строка таблицы orgs в том виде, в каком её возвращает pg. */
interface OrgRow {
  id: string;
  name: string;
  created_at: Date;
  k_scores: Partial<OrgKScores>;
}

/** Преобразует строку БД в доменный объект (с гарантией всех 25 ключей баллов). */
function rowToOrg(row: OrgRow): AuditOrg {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at.toISOString(),
    kScores: { ...DEFAULT_SCORES, ...row.k_scores },
  };
}

/**
 * Хранилище организаций в PostgreSQL.
 * Изолировано за этим модулем — сервисный слой не знает о деталях БД.
 */
export const orgStore = {
  async list(): Promise<AuditOrg[]> {
    const { rows } = await pool.query<OrgRow>(
      'SELECT id, name, created_at, k_scores FROM orgs ORDER BY created_at',
    );
    return rows.map(rowToOrg);
  },

  async get(id: string): Promise<AuditOrg | undefined> {
    const { rows } = await pool.query<OrgRow>(
      'SELECT id, name, created_at, k_scores FROM orgs WHERE id = $1',
      [id],
    );
    return rows[0] ? rowToOrg(rows[0]) : undefined;
  },

  async save(org: AuditOrg): Promise<AuditOrg> {
    const { rows } = await pool.query<OrgRow>(
      `INSERT INTO orgs (id, name, created_at, k_scores)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE
         SET name = EXCLUDED.name, k_scores = EXCLUDED.k_scores
       RETURNING id, name, created_at, k_scores`,
      [org.id, org.name, org.createdAt, JSON.stringify(org.kScores)],
    );
    return rowToOrg(rows[0]);
  },

  async remove(id: string): Promise<boolean> {
    const { rowCount } = await pool.query('DELETE FROM orgs WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  },
};
