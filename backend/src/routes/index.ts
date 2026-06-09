import { Router } from 'express';
import orgsRoutes from './orgs.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

router.use('/orgs', orgsRoutes);

export default router;
