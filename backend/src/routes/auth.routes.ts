import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/me', requireAuth, authController.me);
router.post('/change-password', requireAuth, authController.changePassword);
router.post('/change-email', requireAuth, authController.changeEmail);

export default router;
