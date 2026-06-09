import { randomUUID } from 'node:crypto';
import { orgStore } from '../data/orgStore.js';
import { DEFAULT_SCORES, type AuditOrg, type OrgInput } from '../types/index.js';

/** Бизнес-логика работы с организациями. Не знает об HTTP. */
export const orgsService = {
  list(): AuditOrg[] {
    return orgStore.list();
  },

  getById(id: string): AuditOrg | undefined {
    return orgStore.get(id);
  },

  create(input: OrgInput): AuditOrg {
    const org: AuditOrg = {
      id: randomUUID(),
      name: input.name.trim(),
      createdAt: new Date().toISOString(),
      kScores: { ...DEFAULT_SCORES, ...input.kScores },
    };
    return orgStore.save(org);
  },

  update(id: string, input: OrgInput): AuditOrg | undefined {
    const existing = orgStore.get(id);
    if (!existing) return undefined;
    const updated: AuditOrg = {
      ...existing,
      name: input.name?.trim() ?? existing.name,
      kScores: { ...existing.kScores, ...input.kScores },
    };
    return orgStore.save(updated);
  },

  remove(id: string): boolean {
    return orgStore.remove(id);
  },
};
