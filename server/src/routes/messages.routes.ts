import { Router, Response, NextFunction } from 'express';
import { requireLicenseModule } from '../middlewares/license';
import { AuthenticatedRequest, requireAuth } from '../middlewares/auth';
import prisma from '../config/database';
import { notifications } from '../services/notification.service';

const router = Router();
router.use(requireLicenseModule('messages'));

function toMessage(record: any) {
  return {
    id: record.id,
    from_user_id: record.fromUserId,
    from_user_name: record.fromUser?.name || 'Utilizador',
    from_user_role: record.fromUser?.role || '',
    to_user_id: record.toUserId,
    to_user_name: record.toUser?.name || 'Utilizador',
    to_user_role: record.toUser?.role || '',
    subject: record.subject,
    content: record.content,
    message_type: record.messageType,
    priority: record.priority,
    status: record.status,
    related_to_type: record.relatedToType,
    related_to_id: record.relatedToId,
    created_at: record.createdAt.toISOString(),
    read_at: record.readAt?.toISOString?.(),
  };
}

router.get('/', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const messages = await (prisma as any).message.findMany({
      where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
      include: { fromUser: true, toUser: true },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
    res.status(200).json({ success: true, messages: messages.map(toMessage) });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const from = req.user!;
    const toUserId = req.body.to_user_id || req.body.toUserId;
    if (!toUserId || !req.body.subject || !req.body.content) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Destinatario, assunto e conteudo sao obrigatorios' });
    }

    const to = await prisma.user.findUnique({ where: { id: toUserId } });
    if (!to) return res.status(404).json({ error: 'NOT_FOUND', message: 'Destinatario nao encontrado' });

    const message = await (prisma as any).message.create({
      data: {
        fromUserId: from.id,
        toUserId,
        subject: req.body.subject,
        content: req.body.content,
        priority: req.body.priority || 'medium',
        messageType: req.body.message_type || req.body.messageType || 'internal',
        relatedToType: req.body.related_to_type || req.body.relatedToType || null,
        relatedToId: req.body.related_to_id || req.body.relatedToId || null,
      },
      include: { fromUser: true, toUser: true },
    });

    await notifications.createNotification(
      to.email,
      'message',
      `${from.name} enviou uma mensagem: ${message.subject}`,
      message.id,
      { subject: message.subject, body: `<p>${message.content}</p>` }
    );

    res.status(201).json({ success: true, message: toMessage(message) });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/read', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await (prisma as any).message.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Mensagem nao encontrada' });
    if (existing.toUserId !== req.user!.id) return res.status(403).json({ error: 'FORBIDDEN', message: 'Acesso negado' });

    const message = await (prisma as any).message.update({
      where: { id: req.params.id },
      data: { status: 'read', readAt: new Date() },
      include: { fromUser: true, toUser: true },
    });
    res.status(200).json({ success: true, message: toMessage(message) });
  } catch (error) {
    next(error);
  }
});

export default router;
