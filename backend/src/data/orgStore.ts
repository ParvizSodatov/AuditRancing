import type { AuditOrg } from '../types/index.js';

/**
 * Хранилище организаций в памяти процесса.
 * Изолировано за этим модулем, чтобы позже заменить на БД (Postgres, Mongo и т.п.)
 * без изменения сервисного слоя.
 */
const orgs = new Map<string, AuditOrg>();

export const orgStore = {
  list(): AuditOrg[] {
    return [...orgs.values()];
  },

  get(id: string): AuditOrg | undefined {
    return orgs.get(id);
  },

  save(org: AuditOrg): AuditOrg {
    orgs.set(org.id, org);
    return org;
  },

  remove(id: string): boolean {
    return orgs.delete(id);
  },
};
