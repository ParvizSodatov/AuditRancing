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

export const DEFAULT_SCORES: OrgKScores = {
  k1: 0, k2: 0, k3: 0, k4: 0, k5: 0, k6: 0,
  k7: 0, k8: 0, k9: 0, k10: 0, k11: 0, k12: 0,
  k13: 0, k14: 0, k15: 0, k16: 0, k17: 0, k18: 0,
  k19: 0, k20: 0, k21: 0,
  k22: 0, k23: 0, k24: 0, k25: 0,
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
