import { Router, Response } from 'express';
import { AuthenticatedRequest, requireAuth } from '../middlewares/auth';
import { notifications } from '../services/notification.service';
import { PushService } from '../services/push.service';
import prisma from '../config/database';

const router = Router();

router.get('/stats', requireAuth as any, async (_req: AuthenticatedRequest, res: Response) => {
  const [subscriptions, activeSubscriptions] = await Promise.all([
    prisma.pushSubscription.count(),
    prisma.pushSubscription.count({ where: { active: true } }),
  ]);
  res.status(200).json({
    success: true,
    stats: {
      subscriptions,
      activeSubscriptions,
      enabled: PushService.getStatus().configured,
    }
  });
});

router.get('/vapid-key', (_req, res: Response) => {
  res.status(200).json({ success: true, publicKey: PushService.getStatus().publicKey });
});

router.post('/subscribe', requireAuth as any, async (req: AuthenticatedRequest, res: Response) => {
  const subscription = await PushService.saveSubscription(req.user!.id, req.body.subscription || req.body, req.headers['user-agent']);
  res.status(201).json({ success: true, subscriptionId: subscription.id });
});

router.post('/send-to-user', requireAuth as any, async (req: AuthenticatedRequest, res: Response) => {
  const email = req.body.email || req.body.to;
  const userId = req.body.userId || req.body.user_id || req.user?.id;
  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  const targetUserId = user?.id || userId;
  if (!targetUserId) return res.status(400).json({ error: 'BAD_REQUEST', message: 'Utilizador destino ausente' });

  const result = await PushService.sendToUser(targetUserId, {
    title: req.body.title || 'SIPAR20',
    body: req.body.message || req.body.body || 'Nova notificacao',
    url: req.body.url,
    data: req.body.data,
  });

  if (email) await notifications.createNotification(email, 'push', req.body.message || req.body.title || 'Notificacao SIPAR20');
  res.status(200).json({ success: true, ...result });
});

router.post('/send-to-role', requireAuth as any, async (req: AuthenticatedRequest, res: Response) => {
  const role = req.body.role;
  if (!role) return res.status(400).json({ error: 'BAD_REQUEST', message: 'Role ausente' });
  const result = await PushService.sendToRole(role, {
    title: req.body.title || 'SIPAR20',
    body: req.body.message || req.body.body || 'Nova notificacao',
    url: req.body.url,
    data: req.body.data,
  });
  res.status(200).json({ success: true, ...result });
});

router.post('/broadcast', requireAuth as any, async (req: AuthenticatedRequest, res: Response) => {
  const result = await PushService.broadcast({
    title: req.body.title || 'SIPAR20',
    body: req.body.message || req.body.body || 'Nova notificacao',
    url: req.body.url,
    data: req.body.data,
  });
  res.status(200).json({ success: true, ...result });
});

export default router;
