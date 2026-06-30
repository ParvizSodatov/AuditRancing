/**
 * Доменные типы аудиторской организации.
 * Совпадают по форме с типами фронтенда (frontend/src/types) — это контракт API.
 */

export interface OrgKScores {
  k1: number; k2: number; k3: number; k4: number; k5: number; k6: number;
  k7: number; k8: number; k9: number; k10: number; k11: number; k12: number;
  k13: number; k14: number; k15: number; k16: number; k17: number; k18: number;
  k19: number; k20: number; k21: number;
  k22: number; k23: number; k24: number; k25: number;
}

/**
 * «Не выбрано» = -1 — показатель ещё не заполнен (отличается от настоящего балла 0,
 * например «Доход отсутствует»). Недостающие ключи заполняются этим значением,
 * поэтому новая организация стартует полностью незаполненной. Должно совпадать
 * с UNSET во фронтенде (frontend/src/types).
 */
export const UNSET = -1;

export const DEFAULT_SCORES: OrgKScores = {
  k1: UNSET, k2: UNSET, k3: UNSET, k4: UNSET, k5: UNSET, k6: UNSET,
  k7: UNSET, k8: UNSET, k9: UNSET, k10: UNSET, k11: UNSET, k12: UNSET,
  k13: UNSET, k14: UNSET, k15: UNSET, k16: UNSET, k17: UNSET, k18: UNSET,
  k19: UNSET, k20: UNSET, k21: UNSET,
  k22: UNSET, k23: UNSET, k24: UNSET, k25: UNSET,
};

export interface AuditOrg {
  id: string;
  name: string;
  createdAt: string;
  kScores: OrgKScores;
}

/** Данные для создания/обновления организации (без серверных полей id/createdAt). */
export interface OrgInput {
  name: string;
  kScores?: Partial<OrgKScores>;
}

/** Пользователь системы (для входа в кабинет рейтингового органа). */
export interface User {
  id: string;
  /** Почта — одновременно и логин для входа, и адрес для сброса пароля. */
  email: string;
  /** bcrypt-хеш пароля. Наружу (в API) никогда не отдаётся. */
  passwordHash: string;
  createdAt: string;
}

/** Полезная нагрузка JWT. */
export interface JwtPayload {
  sub: string;
  email: string;
}

/** Токен для сброса пароля по ссылке из письма. */
export interface PasswordResetToken {
  /** SHA-256 хеш токена. Сырой токен хранится только в письме, в БД — лишь хеш. */
  tokenHash: string;
  userId: string;
  expiresAt: string;
  usedAt: string | null;
}
