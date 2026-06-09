import type { NextFunction, Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { ApiError } from './errorHandler.js';

// Расширяем тип Request: после requireAuth доступны данные авторизованного пользователя.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      userLogin?: string;
    }
  }
}

/**
 * Защищает маршрут: требует валидный JWT в заголовке Authorization: Bearer <token>.
 * При успехе кладёт userId/userLogin в req и передаёт управление дальше.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'Требуется авторизация');
  }

  const payload = authService.verifyToken(token);
  req.userId = payload.sub;
  req.userLogin = payload.login;
  next();
}
