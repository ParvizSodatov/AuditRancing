import type { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { ApiError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

function parseCredentials(body: unknown): { login: string; password: string } {
  if (typeof body !== 'object' || body === null) {
    throw new ApiError(400, 'Тело запроса должно быть объектом');
  }
  const { login, password } = body as Record<string, unknown>;
  if (typeof login !== 'string' || login.trim() === '') {
    throw new ApiError(400, 'Поле "login" обязательно');
  }
  if (typeof password !== 'string' || password === '') {
    throw new ApiError(400, 'Поле "password" обязательно');
  }
  return { login: login.trim(), password };
}

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const { login, password } = parseCredentials(req.body);
    res.json(await authService.login(login, password));
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

  changeLogin: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown> | null;
    const currentPassword = body?.currentPassword;
    const newLogin = body?.newLogin;
    if (typeof currentPassword !== 'string' || currentPassword === '') {
      throw new ApiError(400, 'Поле "currentPassword" обязательно');
    }
    if (typeof newLogin !== 'string' || newLogin.trim().length < 3) {
      throw new ApiError(400, 'Логин должен быть не короче 3 символов');
    }
    const user = await authService.changeLogin(req.userId!, currentPassword, newLogin.trim());
    res.json(user);
  }),
};
