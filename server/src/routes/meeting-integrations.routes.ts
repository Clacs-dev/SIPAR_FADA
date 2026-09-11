import { Router, Response, NextFunction } from 'express';
import { requireLicenseModule } from '../middlewares/license';
import { AuthenticatedRequest, requireAuth, requireSystemAdmin } from '../middlewares/auth';
import { MeetingLinkService } from '../services/meeting-link.service';
import { SettingsService } from '../services/settings.service';

const router = Router();
router.use(requireLicenseModule('settings'));

/**
 * Credenciais OAuth das plataformas de reuniao (Zoom/Teams/Google Meet),
 * geridas pelo admin_sistema em vez de .env - ver server/src/services/settings.service.ts.
 * Cada plataforma so gera reunioes reais se TODOS os seus campos estiverem
 * preenchidos; caso contrario o sistema usa o link fixo de fallback
 * (default_link), ver MeetingLinkService.
 */
const PLATFORM_FIELDS: Record<string, readonly string[]> = {
  googlemeet: ['google_client_id', 'google_client_secret', 'google_refresh_token', 'google_calendar_id', 'meeting_googlemeet_default_link'],
  zoom: ['zoom_account_id', 'zoom_client_id', 'zoom_client_secret', 'meeting_zoom_default_link'],
  teams: ['teams_tenant_id', 'teams_client_id', 'teams_client_secret', 'teams_user_id', 'meeting_teams_default_link'],
};
const SECRET_FIELDS = new Set(['google_client_secret', 'google_refresh_token', 'zoom_client_secret', 'teams_client_secret']);
const GENERAL_FIELDS = ['meeting_default_link', 'meeting_timezone'] as const;

// Lista, para QUALQUER utilizador autenticado (nao so admin_sistema), quais
// plataformas produzem de facto um link - usado pelos seletores de
// plataforma ao agendar reunioes, para nunca oferecer uma opcao que vai
// falhar. Sem segredos, ao contrario da rota "/" abaixo (admin only).
router.get('/available', requireAuth as any, (_req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({ success: true, platforms: MeetingLinkService.listAvailablePlatforms() });
});

router.get('/', requireAuth as any, requireSystemAdmin as any, (_req: AuthenticatedRequest, res: Response) => {
  const platforms: Record<string, Record<string, string | null>> = {};
  for (const [platform, fields] of Object.entries(PLATFORM_FIELDS)) {
    platforms[platform] = {};
    for (const field of fields) {
      const raw = SettingsService.get(field);
      platforms[platform][field] = SECRET_FIELDS.has(field) ? (raw ? '••••••••' : null) : (raw ?? null);
    }
  }
  const general: Record<string, string | null> = {};
  for (const field of GENERAL_FIELDS) {
    general[field] = SettingsService.get(field) ?? null;
  }
  res.status(200).json({ success: true, platforms, general, status: MeetingLinkService.getConfigStatus() });
});

router.put('/', requireAuth as any, requireSystemAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const body = req.body || {};
    const ctx = { userId: req.user!.id, userName: req.user!.name };
    const allFields = [...Object.values(PLATFORM_FIELDS).flat(), ...GENERAL_FIELDS];
    for (const field of allFields) {
      if (!(field in body)) continue;
      const value = String(body[field] ?? '');
      if (SECRET_FIELDS.has(field) && value.includes('•')) continue; // placeholder mascarado, nao sobrescrever
      await SettingsService.set(field, value, ctx);
    }
    res.status(200).json({ success: true, message: 'Configuração de plataformas de reunião atualizada' });
  } catch (error) {
    next(error);
  }
});

export default router;
