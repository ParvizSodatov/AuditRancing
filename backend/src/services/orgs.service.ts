import { randomUUID } from 'node:crypto';
import { orgStore } from '../data/orgStore.js';
import { DEFAULT_SCORES, type AuditOrg, type OrgInput } from '../types/index.js';

/** Бизнес-логика работы с организациями. Не знает об HTTP. */
export const orgsService = {
  list(): Promise<AuditOrg[]> {
    return orgStore.list();
  },

  getById(id: string): Promise<AuditOrg | undefined> {
    return orgStore.get(id);
  },

  create(input: OrgInput): Promise<AuditOrg> {
    const org: AuditOrg = {
      id: randomUUID(),
      name: input.name.trim(),
      createdAt: new Date().toISOString(),
      kScores: { ...DEFAULT_SCORES, ...input.kScores },
    };
    return orgStore.save(org);
  },

  async update(id: string, input: OrgInput): Promise<AuditOrg | undefined> {
    const existing = await orgStore.get(id);
    if (!existing) return undefined;
    const updated: AuditOrg = {
      ...existing,
      name: input.name?.trim() ?? existing.name,
      kScores: { ...existing.kScores, ...input.kScores },
    };
    return orgStore.save(updated);
  },

  remove(id: string): Promise<boolean> {
    return orgStore.remove(id);
  },
};
