import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { userStore } from '../data/userStore.js';
import { config } from '../config/env.js';
import { ApiError } from '../middleware/errorHandler.js';
import type { JwtPayload, User } from '../types/index.js';

/** Публичное представление пользователя — без хеша пароля. */
export interface PublicUser {
  id: string;
  login: string;
}

function toPublic(user: User): PublicUser {
  return { id: user.id, login: user.login };
}

/** Бизнес-логика аутентификации. Не знает об HTTP. */
export const authService = {
  /**
   * Проверяет логин/пароль и при успехе возвращает JWT-токен и данные пользователя.
   * При неверных данных бросает 401 (без подсказки, что именно неверно).
   */
  async login(login: string, password: string): Promise<{ token: string; user: PublicUser }> {
    const user = await userStore.findByLogin(login);
    // Сравниваем пароль даже при отсутствии пользователя, чтобы не выдать его существование по времени ответа.
    const hash = user?.passwordHash ?? '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva';
    const ok = await bcrypt.compare(password, hash);
    if (!user || !ok) {
      throw new ApiError(401, 'Неверный логин или пароль');
    }

    const payload: JwtPayload = { sub: user.id, login: user.login };
    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    } as SignOptions);

    return { token, user: toPublic(user) };
  },

  /** Возвращает публичные данные пользователя по id (для эндпоинта /me). */
  async getProfile(id: string): Promise<PublicUser | undefined> {
    const user = await userStore.get(id);
    return user ? toPublic(user) : undefined;
  },

  /**
   * Меняет пароль пользователю: проверяет текущий пароль и сохраняет хеш нового.
   * Бросает 400, если текущий пароль неверный.
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await userStore.get(userId);
    if (!user) throw new ApiError(404, 'Пользователь не найден');

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new ApiError(400, 'Текущий пароль неверный');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await userStore.updatePassword(userId, passwordHash);
  },

  /**
   * Меняет логин пользователю: проверяет текущий пароль и уникальность нового логина.
   * Возвращает обновлённые публичные данные пользователя.
   */
  async changeLogin(userId: string, currentPassword: string, newLogin: string): Promise<PublicUser> {
    const user = await userStore.get(userId);
    if (!user) throw new ApiError(404, 'Пользователь не найден');

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new ApiError(400, 'Текущий пароль неверный');

    const taken = await userStore.findByLogin(newLogin);
    if (taken && taken.id !== userId) {
      throw new ApiError(409, 'Такой логин уже занят');
    }

    await userStore.updateLogin(userId, newLogin);
    return { id: user.id, login: newLogin };
  },

  /** Проверяет JWT и возвращает полезную нагрузку. Бросает 401 при невалидном токене. */
  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.jwtSecret) as JwtPayload;
    } catch {
      throw new ApiError(401, 'Недействительный или истёкший токен');
    }
  },
};
