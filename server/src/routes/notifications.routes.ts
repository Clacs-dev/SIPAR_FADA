import { Router, Response, NextFunction } from 'express';
import { requireLicenseModule } from '../middlewares/license';
import { AuthenticatedRequest, requireAuth } from '../middlewares/auth';
import prisma from '../config/database';

const router = Router();
router.use(requireLicenseModule('notifications'));

function toEmailNotification(record: any) {
  const metadata = record.metadata ? JSON.parse(record.metadata) : {};
  return {
    id: record.id,
    to: record.email,
    email: record.email,
    subject: metadata.subject || `Notificacao SIPAR20: ${record.type}`,
    body: metadata.body || `<p>${record.message}</p>`,
    type: record.type,
    status: record.status || 'sent',
    message: record.message,
    read: record.read,
    resourceId: record.resourceId,
    created_at: record.createdAt.toISOString(),
    sent_at: record.createdAt.toISOString(),
    data: metadata,
  };
}

router.get('/user/:email', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const records = await prisma.notification.findMany({
      where: req.user?.role === 'admin' ? {} : { email },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.status(200).json({ success: true, notifications: records.map(toEmailNotification) });
  } catch (error) {
    next(error);
  }
});

router.post('/send-pending', requireAuth as any, async (_req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({ success: true, processed: 0, message: 'Nao existem notificacoes pendentes na fila local.' });
});

router.put('/:id/read', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });
    res.status(200).json({ success: true, notification: toEmailNotification(notification) });
  } catch (error) {
    next(error);
  }
});

export default router;
