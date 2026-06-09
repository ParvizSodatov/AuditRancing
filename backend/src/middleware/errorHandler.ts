import type { NextFunction, Request, Response } from 'express';

/** Ошибка с HTTP-статусом, бросается из контроллеров/сервисов. */
export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Обработчик несуществующих маршрутов (404). */
export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Not Found' });
}

/** Централизованный обработчик ошибок. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
}
