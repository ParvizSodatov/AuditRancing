import type { Request, Response } from 'express';
import { orgsService } from '../services/orgs.service.js';
import { ApiError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import type { OrgInput } from '../types/index.js';

function parseInput(body: unknown): OrgInput {
  if (typeof body !== 'object' || body === null) {
    throw new ApiError(400, 'Тело запроса должно быть объектом');
  }
  const { name, kScores } = body as Record<string, unknown>;
  if (typeof name !== 'string' || name.trim() === '') {
    throw new ApiError(400, 'Поле "name" обязательно');
  }
  if (kScores !== undefined && (typeof kScores !== 'object' || kScores === null)) {
    throw new ApiError(400, 'Поле "kScores" должно быть объектом');
  }
  return { name, kScores: kScores as OrgInput['kScores'] };
}

export const orgsController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    res.json(await orgsService.list());
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const org = await orgsService.getById(req.params.id);
    if (!org) throw new ApiError(404, 'Организация не найдена');
    res.json(org);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const org = await orgsService.create(parseInput(req.body));
    res.status(201).json(org);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const org = await orgsService.update(req.params.id, parseInput(req.body));
    if (!org) throw new ApiError(404, 'Организация не найдена');
    res.json(org);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const ok = await orgsService.remove(req.params.id);
    if (!ok) throw new ApiError(404, 'Организация не найдена');
    res.status(204).send();
  }),
};
