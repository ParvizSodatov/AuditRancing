/**
 * Хранение JWT-токена авторизации в localStorage и оповещение об разлогине.
 * Сам токен добавляется к запросам в utils/api.ts (заголовок Authorization).
 */
const TOKEN_KEY = 'auditrank_token_v1';

const listeners = new Set<() => void>();

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/** Удаляет токен и оповещает подписчиков (UI переключается на страницу входа). */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  listeners.forEach(fn => fn());
}

/** Подписка на событие разлогина (истёкший/невалидный токен). Возвращает функцию отписки. */
export function onUnauthorized(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
