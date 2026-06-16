import type { AuditOrg, OrgKScores } from '../types';
import { getToken, setToken, clearToken } from './auth';
import i18n from '../i18n';

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
    const token = getToken();
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });

    if (!res.ok) {
      // Токен истёк/недействителен — разлогиниваем (UI вернёт на страницу входа).
      if (res.status === 401) clearToken();
      let message = i18n.t('errors.requestError', { status: res.status });
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

/** Данные авторизованного пользователя (без пароля). */
export interface AuthUser {
  id: string;
  email: string;
}

/** Клиент REST API организаций. */
export const api = {
  /** Вход: проверяет почту/пароль, сохраняет токен и возвращает данные пользователя. */
  async login(email: string, password: string): Promise<AuthUser> {
    const { token, user } = await request<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(token);
    return user;
  },

  /** Запрос ссылки для сброса пароля на почту. Ответ всегда успешный (не раскрывает наличие почты). */
  forgotPassword: (email: string): Promise<{ ok: boolean }> =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  /** Установка нового пароля по токену из письма. */
  resetPassword: (token: string, newPassword: string): Promise<void> =>
    request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),

  /** Проверка текущей сессии по сохранённому токену. */
  me: (): Promise<AuthUser> => request('/auth/me'),

  /** Смена пароля текущего пользователя. */
  changePassword: (currentPassword: string, newPassword: string): Promise<void> =>
    request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  /** Смена почты текущего пользователя. Возвращает обновлённые данные. */
  changeEmail: (currentPassword: string, newEmail: string): Promise<AuthUser> =>
    request('/auth/change-email', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newEmail }),
    }),

  /** Выход: просто удаляет токен на клиенте. */
  logout: (): void => clearToken(),

  listOrgs: (): Promise<AuditOrg[]> => request('/orgs'),

  createOrg: (input: OrgInput): Promise<AuditOrg> =>
    request('/orgs', { method: 'POST', body: JSON.stringify(input) }),

  updateOrg: (id: string, input: OrgInput): Promise<AuditOrg> =>
    request(`/orgs/${id}`, { method: 'PUT', body: JSON.stringify(input) }),

  deleteOrg: (id: string): Promise<void> =>
    request(`/orgs/${id}`, { method: 'DELETE' }),
};
