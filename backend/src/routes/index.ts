import { Router } from 'express';
import orgsRoutes from './orgs.routes.js';
import authRoutes from './auth.routes.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

router.use('/auth', authRoutes);
// Все операции с организациями доступны только авторизованным пользователям.
router.use('/orgs', requireAuth, orgsRoutes);

export default router;
