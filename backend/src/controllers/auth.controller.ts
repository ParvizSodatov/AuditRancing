import type { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { ApiError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

/** Простая проверка формата почты — достаточно для валидации ввода. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmail(value: unknown): value is string {
  return typeof value === 'string' && EMAIL_RE.test(value.trim());
}

function parseCredentials(body: unknown): { email: string; password: string } {
  if (typeof body !== 'object' || body === null) {
    throw new ApiError(400, 'Тело запроса должно быть объектом');
  }
  const { email, password } = body as Record<string, unknown>;
  // На входе формат почты строго не проверяем — иначе старые нестандартные
  // учётки не смогли бы войти; достаточно, что поле не пустое.
  if (typeof email !== 'string' || email.trim() === '') {
    throw new ApiError(400, 'Поле "email" обязательно');
  }
  if (typeof password !== 'string' || password === '') {
    throw new ApiError(400, 'Поле "password" обязательно');
  }
  return { email: email.trim(), password };
}

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = parseCredentials(req.body);
    res.json(await authService.login(email, password));
  }),

  // req.userId проставляется middleware requireAuth.
  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getProfile(req.userId!);
    if (!user) throw new ApiError(404, 'Пользователь не найден');
    res.json(user);
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown> | null;
    const currentPassword = body?.currentPassword;
    const newPassword = body?.newPassword;
    if (typeof currentPassword !== 'string' || currentPassword === '') {
      throw new ApiError(400, 'Поле "currentPassword" обязательно');
    }
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      throw new ApiError(400, 'Новый пароль должен быть не короче 6 символов');
    }
    await authService.changePassword(req.userId!, currentPassword, newPassword);
    res.status(204).send();
  }),

  changeEmail: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown> | null;
    const currentPassword = body?.currentPassword;
    const newEmail = body?.newEmail;
    if (typeof currentPassword !== 'string' || currentPassword === '') {
      throw new ApiError(400, 'Поле "currentPassword" обязательно');
    }
    if (!isEmail(newEmail)) {
      throw new ApiError(400, 'Введите корректный адрес почты');
    }
    const user = await authService.changeEmail(req.userId!, currentPassword, newEmail.trim());
    res.json(user);
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown> | null;
    const email = body?.email;
    if (!isEmail(email)) {
      throw new ApiError(400, 'Введите корректный адрес почты');
    }
    await authService.requestPasswordReset(email.trim());
    // Всегда одинаковый ответ — чтобы нельзя было перебором узнать, какие почты зарегистрированы.
    res.json({ ok: true });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown> | null;
    const token = body?.token;
    const newPassword = body?.newPassword;
    if (typeof token !== 'string' || token.trim() === '') {
      throw new ApiError(400, 'Отсутствует токен сброса');
    }
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      throw new ApiError(400, 'Новый пароль должен быть не короче 6 символов');
    }
    await authService.resetPassword(token.trim(), newPassword);
    res.status(204).send();
  }),
};
