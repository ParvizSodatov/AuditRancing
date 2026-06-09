import type { NextFunction, Request, Response } from 'express';

/**
 * Оборачивает async-обработчик так, чтобы отклонённый промис (ошибка)
 * передавался в errorHandler через next() — Express 4 сам этого не делает.
 */
export function asyncHandler(
  fn: (req: Request, res: Response) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res).catch(next);
  };
}
