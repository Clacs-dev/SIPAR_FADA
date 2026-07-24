import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth';

const router = Router();

// Rotas públicas
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/reset-password', AuthController.resetPassword);
router.post('/reset-demo-users', (_req, res) => {
  res.status(200).json({ success: true, message: 'Utilizadores demo mantidos pelo seed local.' });
});

// Rotas protegidas
router.get('/me', requireAuth as any, AuthController.me as any);
router.post('/logout', requireAuth as any, AuthController.logout as any);

export default router;
