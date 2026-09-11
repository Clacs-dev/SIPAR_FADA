import { Router, Response, NextFunction } from 'express';
import { requireLicenseModule } from '../middlewares/license';
import { AuthenticatedRequest, requireAuth, requireSystemAdmin } from '../middlewares/auth';
import { emailService } from '../services/email.service';
import { MeetingLinkService } from '../services/meeting-link.service';
import { SettingsService } from '../services/settings.service';

const router = Router();
router.use(requireLicenseModule('email'));

const EMAIL_CONFIG_FIELDS = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'gmail_user', 'gmail_app_password', 'from'] as const;
const EMAIL_SECRET_FIELDS = new Set(['smtp_pass', 'gmail_app_password']);

// LER a configuracao guardada pelo admin (segredos mascarados - nunca
// devolvidos em claro depois de gravados, so indicacao de que existem).
router.get('/config', requireAuth as any, requireSystemAdmin as any, (_req: AuthenticatedRequest, res: Response) => {
  const values: Record<string, string | null> = {};
  for (const field of EMAIL_CONFIG_FIELDS) {
    const raw = SettingsService.get(`email_${field}`);
    if (EMAIL_SECRET_FIELDS.has(field)) {
      values[field] = raw ? '••••••••' : null;
    } else {
      values[field] = raw ?? null;
    }
  }
  res.status(200).json({ success: true, config: values, hasOverrides: EMAIL_CONFIG_FIELDS.some((f) => SettingsService.hasOverride(`email_${f}`)) });
});

// GRAVAR configuracao nova. Campos de segredo (*_pass/*_app_password) so sao
// substituidos se um valor novo, nao-vazio, for enviado - permite deixar a
// password como esta ao editar so o resto sem a reenviar em claro.
router.put('/config', requireAuth as any, requireSystemAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const body = req.body || {};
    const ctx = { userId: req.user!.id, userName: req.user!.name };
    for (const field of EMAIL_CONFIG_FIELDS) {
      if (!(field in body)) continue;
      const value = String(body[field] ?? '');
      if (EMAIL_SECRET_FIELDS.has(field) && value.includes('•')) continue; // placeholder mascarado, nao sobrescrever
      await SettingsService.set(`email_${field}`, value, ctx);
    }
    emailService.resetTransporter();
    res.status(200).json({ success: true, message: 'Configuração de e-mail atualizada' });
  } catch (error) {
    next(error);
  }
});

router.get('/test', requireAuth as any, requireSystemAdmin as any, async (_req: AuthenticatedRequest, res: Response) => {
  const verification = await emailService.verifyConnection();
  res.status(200).json({
    success: true,
    email: emailService.getStatus(),
    verification,
    meetings: MeetingLinkService.getConfigStatus(),
  });
});

router.get('/stats', requireAuth as any, requireSystemAdmin as any, async (_req: AuthenticatedRequest, res: Response) => {
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

router.post('/send-test', requireAuth as any, requireSystemAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
