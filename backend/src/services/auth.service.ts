import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { createHash, randomBytes } from 'node:crypto';
import { userStore, resetTokenStore } from '../data/userStore.js';
import { emailService } from './email.service.js';
import { config } from '../config/env.js';
import { ApiError } from '../middleware/errorHandler.js';
import type { JwtPayload, User } from '../types/index.js';

/** Публичное представление пользователя — без хеша пароля. */
export interface PublicUser {
  id: string;
  email: string;
}

function toPublic(user: User): PublicUser {
  return { id: user.id, email: user.email };
}

/** Хешируем сырой токен сброса, чтобы в БД не лежал секрет в открытом виде. */
function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

/** Бизнес-логика аутентификации. Не знает об HTTP. */
export const authService = {
  /**
   * Проверяет почту/пароль и при успехе возвращает JWT-токен и данные пользователя.
   * При неверных данных бросает 401 (без подсказки, что именно неверно).
   */
  async login(email: string, password: string): Promise<{ token: string; user: PublicUser }> {
    const user = await userStore.findByEmail(email);
    // Сравниваем пароль даже при отсутствии пользователя, чтобы не выдать его существование по времени ответа.
    const hash = user?.passwordHash ?? '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva';
    const ok = await bcrypt.compare(password, hash);
    if (!user || !ok) {
      throw new ApiError(401, 'Неверная почта или пароль');
    }

    const payload: JwtPayload = { sub: user.id, email: user.email };
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
   * Меняет почту пользователю: проверяет текущий пароль и уникальность новой почты.
   * Возвращает обновлённые публичные данные пользователя.
   */
  async changeEmail(userId: string, currentPassword: string, newEmail: string): Promise<PublicUser> {
    const user = await userStore.get(userId);
    if (!user) throw new ApiError(404, 'Пользователь не найден');

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new ApiError(400, 'Текущий пароль неверный');

    const taken = await userStore.findByEmail(newEmail);
    if (taken && taken.id !== userId) {
      throw new ApiError(409, 'Эта почта уже используется');
    }

    await userStore.updateEmail(userId, newEmail);
    return { id: user.id, email: newEmail };
  },

  /**
   * Запрос на сброс пароля: если пользователь с такой почтой есть — создаёт
   * одноразовый токен и отправляет письмо со ссылкой. Существование почты наружу
   * не раскрывает (контроллер всегда отвечает одинаково).
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await userStore.findByEmail(email);
    if (!user) return; // молча выходим — не подсказываем, что такой почты нет

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + config.resetTokenTtlMinutes * 60_000);
    await resetTokenStore.create(user.id, tokenHash, expiresAt);

    const resetUrl = `${config.appUrl}/reset?token=${rawToken}`;
    await emailService.sendPasswordReset(user.email, resetUrl);
  },

  /**
   * Завершает сброс пароля по токену из письма: проверяет токен (существует,
   * не использован, не истёк), ставит новый пароль и гасит токен.
   */
  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const record = await resetTokenStore.findByHash(hashToken(rawToken));
    if (!record || record.usedAt || new Date(record.expiresAt) < new Date()) {
      throw new ApiError(400, 'Ссылка для сброса недействительна или устарела');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await userStore.updatePassword(record.userId, passwordHash);
    await resetTokenStore.markUsed(record.tokenHash);
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
