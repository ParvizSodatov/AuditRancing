import type { AuditOrg, OrgKScores } from '../types';

/** Базовый адрес API. Меняется через VITE_API_URL при сборке. */
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

/** Данные для создания/обновления организации (без серверных полей id/createdAt). */
export interface OrgInput {
  name: string;
  kScores?: Partial<OrgKScores>;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    let message = `Ошибка запроса (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch { /* тело не JSON — оставляем дефолтное сообщение */ }
    throw new Error(message);
  }

  // 204 No Content (например, при удалении) — тела нет.
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Клиент REST API организаций. */
export const api = {
  listOrgs: (): Promise<AuditOrg[]> => request('/orgs'),

  createOrg: (input: OrgInput): Promise<AuditOrg> =>
    request('/orgs', { method: 'POST', body: JSON.stringify(input) }),

  updateOrg: (id: string, input: OrgInput): Promise<AuditOrg> =>
    request(`/orgs/${id}`, { method: 'PUT', body: JSON.stringify(input) }),

  deleteOrg: (id: string): Promise<void> =>
    request(`/orgs/${id}`, { method: 'DELETE' }),
};
