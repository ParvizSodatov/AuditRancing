import type { AuditOrg, OrgKScores } from '../types';

/** Базовый адрес API. Меняется через VITE_API_URL при сборке. */
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

/** Данные для создания/обновления организации (без серверных полей id/createdAt). */
export interface OrgInput {
  name: string;
  kScores?: Partial<OrgKScores>;
}

// ── Глобальный трекер активных запросов ──
// Считаем число запросов «в полёте» и оповещаем подписчиков (UI-лоудер),
// чтобы индикатор загрузки автоматически появлялся на любой вызов api.*.
let inFlight = 0;
const listeners = new Set<(loading: boolean) => void>();

function emit() {
  const loading = inFlight > 0;
  listeners.forEach(fn => fn(loading));
}

/** Подписка на состояние загрузки. Возвращает функцию отписки. */
export function onLoadingChange(fn: (loading: boolean) => void): () => void {
  listeners.add(fn);
  fn(inFlight > 0);
  return () => listeners.delete(fn);
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  inFlight += 1;
  emit();
  try {
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
  } finally {
    inFlight -= 1;
    emit();
  }
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
