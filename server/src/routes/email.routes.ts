import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest, requireAuth } from '../middlewares/auth';
import { emailService } from '../services/email.service';
import { MeetingLinkService } from '../services/meeting-link.service';

const router = Router();

router.get('/test', requireAuth as any, async (_req: AuthenticatedRequest, res: Response) => {
  const verification = await emailService.verifyConnection();
  res.status(200).json({
    success: true,
    email: emailService.getStatus(),
    verification,
    meetings: MeetingLinkService.getConfigStatus(),
  });
});

router.get('/stats', requireAuth as any, async (_req: AuthenticatedRequest, res: Response) => {
  const email = emailService.getStatus();
  res.status(200).json({
    success: true,
    configured: email.configured,
    provider: email.provider,
    email,
    stats: {
      configured: email.configured,
      provider: email.provider,
      pending: 0,
      sent: 0,
      failed: 0,
    }
  });
});

router.post('/send-test', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const to = req.body.to || req.user?.email;
    if (!to) return res.status(400).json({ error: 'BAD_REQUEST', message: 'Destino de email ausente' });

    const sent = await emailService.sendEmail({
      to,
      subject: req.body.subject || 'Teste de email SIPAR20',
      html: req.body.html || '<p>Este e um email de teste do SIPAR20.</p>',
    });

    res.status(200).json({ success: sent, sent });
  } catch (error) {
    next(error);
  }
});

export default router;
