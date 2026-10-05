import { Router, Response, NextFunction } from 'express';
import { requireLicenseModule } from '../middlewares/license';
import fs from 'fs';
import path from 'path';
import { AuthenticatedRequest, requireAuth, requireSystemAdmin } from '../middlewares/auth';
import prisma from '../config/database';
import logger from '../config/logger';
import { emailService } from '../services/email.service';
import { PushService } from '../services/push.service';
import { MeetingLinkService } from '../services/meeting-link.service';
import { auditService } from '../services/audit.service';
import { MODULES, ACTIONS } from '../utils/permissions';
import { BackupService } from '../services/backup.service';

const router = Router();
router.use(requireLicenseModule('settings'));

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
const LOGS_DIR = path.join(__dirname, '../../logs');
const MIGRATIONS_DIR = path.join(__dirname, '../../prisma/migrations');

type HealthStatus = 'healthy' | 'warning' | 'degraded' | 'critical' | 'offline';

interface HealthComponent {
  name: string;
  status: HealthStatus;
  detail: string;
}

const STATUS_SCORE: Record<HealthStatus, number> = {
  healthy: 100,
  warning: 70,
  degraded: 40,
  critical: 10,
  offline: 0,
};

router.get('/health', requireAuth as any, requireSystemAdmin as any, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const components: HealthComponent[] = [];

    components.push({ name: 'api', status: 'healthy', detail: 'Servidor Express respondeu ao pedido.' });

    try {
      await prisma.$queryRaw`SELECT 1`;
      components.push({ name: 'database', status: 'healthy', detail: 'Consulta de verificacao ao SQLite bem-sucedida.' });
    } catch (error: any) {
      components.push({ name: 'database', status: 'critical', detail: `Falha ao consultar a base de dados: ${error?.message || 'erro desconhecido'}` });
    }

    components.push({
      name: 'auth',
      status: process.env.JWT_SECRET ? 'healthy' : 'critical',
      detail: process.env.JWT_SECRET ? 'JWT_SECRET definido.' : 'JWT_SECRET ausente.',
    });

    try {
      const emailStatus = emailService.getStatus();
      if (!emailStatus.configured) {
        components.push({ name: 'email', status: 'warning', detail: 'SMTP nao configurado. Emails caem em modo de simulacao (apenas logs).' });
      } else {
        const verification = await emailService.verifyConnection();
        components.push({
          name: 'email',
          status: verification.ok ? 'healthy' : 'degraded',
          detail: verification.ok ? `Conexao SMTP verificada (${emailStatus.provider}).` : `Falha ao verificar SMTP: ${verification.error}`,
        });
      }
    } catch (error: any) {
      components.push({ name: 'email', status: 'degraded', detail: `Erro ao verificar email: ${error?.message}` });
    }

    const pushStatus = PushService.getStatus();
    components.push({
      name: 'push',
      status: pushStatus.configured ? 'healthy' : 'warning',
      detail: pushStatus.configured ? 'VAPID configurado.' : 'VAPID nao configurado. Notificacoes push desativadas.',
    });

    try {
      const meetingStatus = MeetingLinkService.getConfigStatus();
      const platformStatuses = [meetingStatus.googlemeet, meetingStatus.zoom, meetingStatus.teams];
      const anyConfigured = platformStatuses.some((platform) => platform.configured);
      const anyFallback = meetingStatus.generalFallbackLink || platformStatuses.some((platform) => platform.fallbackLink);
      components.push({
        name: 'meeting_integrations',
        status: anyConfigured ? 'healthy' : anyFallback ? 'warning' : 'offline',
        detail: anyConfigured
          ? 'Pelo menos uma plataforma de reuniao tem API real configurada.'
          : anyFallback
            ? 'Nenhuma API real configurada; a usar links fixos de fallback.'
            : 'Nenhuma plataforma de reuniao configurada (nem API, nem link fixo).',
      });
    } catch (error: any) {
      components.push({ name: 'meeting_integrations', status: 'degraded', detail: `Erro ao verificar integracoes: ${error?.message}` });
    }

    try {
      const testFile = path.join(UPLOAD_DIR, `.health-check-${Date.now()}`);
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      fs.writeFileSync(testFile, 'ok');
      fs.unlinkSync(testFile);
      components.push({ name: 'storage', status: 'healthy', detail: 'Escrita/leitura no diretorio de uploads local bem-sucedida.' });
    } catch (error: any) {
      components.push({ name: 'storage', status: 'critical', detail: `Falha ao escrever no diretorio de uploads: ${error?.message}` });
    }

    components.push({ name: 'jobs_queues', status: 'offline', detail: 'Nao existe infraestrutura de filas/cron/workers neste sistema.' });

    const overallPercent = Math.round(
      components.reduce((sum, c) => sum + STATUS_SCORE[c.status], 0) / components.length
    );

    res.status(200).json({ success: true, overallPercent, components });
  } catch (error) {
    next(error);
  }
});

router.get('/diagnostics', requireAuth as any, requireSystemAdmin as any, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const [
      users, departments, roles, presentations, audiences, pedidos, oficios,
      comunicacoes, actas, internalMeetings, meetingRooms, messages, notifications,
      auditLogs, uploadedFiles, pushSubscriptions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.department.count(),
      prisma.role.count(),
      prisma.presentation.count(),
      prisma.audience.count(),
      prisma.pedido.count(),
      prisma.oficio.count(),
      prisma.comunicacao.count(),
      prisma.acta.count(),
      prisma.internalMeeting.count(),
      prisma.meetingRoom.count(),
      prisma.message.count(),
      prisma.notification.count(),
      prisma.auditLog.count(),
      prisma.uploadedFile.count(),
      prisma.pushSubscription.count(),
    ]);

    // Ficheiro SQLite ou, em PostgreSQL, pg_database_size().
    const dbFileSizeBytes: number | null = await BackupService.tamanhoBaseDados();

    let migrations: string[] = [];
    try {
      migrations = fs.readdirSync(MIGRATIONS_DIR).filter((entry) => fs.statSync(path.join(MIGRATIONS_DIR, entry)).isDirectory());
    } catch {
      migrations = [];
    }

    const uploadedFileRecords = await prisma.uploadedFile.findMany({ select: { filename: true, size: true, module: true } });
    const byModule: Record<string, { count: number; sizeBytes: number }> = {};
    let totalSizeBytes = 0;
    let missingOnDisk = 0;
    for (const file of uploadedFileRecords) {
      const key = file.module || 'sem_modulo';
      if (!byModule[key]) byModule[key] = { count: 0, sizeBytes: 0 };
      byModule[key].count += 1;
      byModule[key].sizeBytes += file.size;
      totalSizeBytes += file.size;
      if (!fs.existsSync(path.join(UPLOAD_DIR, file.filename))) missingOnDisk += 1;
    }

    let orphanOnDisk = 0;
    try {
      const dbFilenames = new Set(uploadedFileRecords.map((f) => f.filename));
      const diskFiles = fs.readdirSync(UPLOAD_DIR).filter((f) => !f.startsWith('.'));
      orphanOnDisk = diskFiles.filter((f) => !dbFilenames.has(f)).length;
    } catch {
      orphanOnDisk = 0;
    }

    const [sentEmails, failedEmails] = await Promise.all([
      prisma.auditLog.count({ where: { action: 'email_sent' } }),
      prisma.auditLog.count({ where: { action: 'email_failed' } }),
    ]);

    const [activeSubscriptions, inactiveSubscriptions] = await Promise.all([
      prisma.pushSubscription.count({ where: { active: true } }),
      prisma.pushSubscription.count({ where: { active: false } }),
    ]);

    const [totalNotifications, unreadNotifications] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.count({ where: { read: false } }),
    ]);

    const allRoles = await prisma.role.findMany({ select: { id: true, slug: true, nome: true } });
    const unusedRoles: string[] = [];
    for (const role of allRoles) {
      const count = await prisma.user.count({ where: { role: role.slug } });
      if (count === 0) unusedRoles.push(role.slug);
    }

    const validModules = new Set(Object.values(MODULES));
    const validActions = new Set(Object.values(ACTIONS));
    const allPermissions = await prisma.rolePermission.findMany({ select: { module: true, action: true } });
    const orphanPermissions = allPermissions
      .filter((p) => !validModules.has(p.module as any) || !validActions.has(p.action as any))
      .map((p) => `${p.module}.${p.action}`);

    res.status(200).json({
      success: true,
      database: {
        counts: {
          users, departments, roles, presentations, audiences, pedidos, oficios,
          comunicacoes, actas, internalMeetings, meetingRooms, messages, notifications,
          auditLogs, uploadedFiles, pushSubscriptions,
        },
        dbFileSizeBytes,
        migrations,
      },
      storage: {
        totalFiles: uploadedFileRecords.length,
        totalSizeBytes,
        byModule,
        integrity: { missingOnDisk, orphanOnDisk },
      },
      email: { ...emailService.getStatus(), sent: sentEmails, failed: failedEmails, asyncQueue: false },
      push: { ...PushService.getStatus(), activeSubscriptions, inactiveSubscriptions },
      notifications: { total: totalNotifications, unread: unreadNotifications },
      rbac: { unusedRoles, orphanPermissions },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/logs', requireAuth as any, requireSystemAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { level, search } = req.query as Record<string, string>;
    const limit = Math.min(Number(req.query.limit || 200), 500);
    const files = ['error.log', 'combined.log'];

    let entries: any[] = [];
    for (const file of files) {
      const filePath = path.join(LOGS_DIR, file);
      if (!fs.existsSync(filePath)) continue;
      const raw = fs.readFileSync(filePath, 'utf-8');
      const lines = raw.split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          entries.push(JSON.parse(line));
        } catch {
          // linha nao-JSON (ex: morgan sem stream json), ignorar
        }
      }
    }

    if (level) entries = entries.filter((e) => e.level === level);
    if (search) {
      const term = search.toLowerCase();
      entries = entries.filter((e) => JSON.stringify(e).toLowerCase().includes(term));
    }

    entries.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

    res.status(200).json({ success: true, logs: entries.slice(0, limit), total: entries.length });
  } catch (error) {
    next(error);
  }
});

router.get('/maintenance-mode', requireAuth as any, requireSystemAdmin as any, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'maintenance_mode' } });
    const value = setting ? JSON.parse(setting.value) : { enabled: false, message: '', eta: null };
    res.status(200).json({ success: true, maintenance: value, updatedByName: setting?.updatedByName || null, updatedAt: setting?.updatedAt || null });
  } catch (error) {
    next(error);
  }
});

router.post('/maintenance-mode', requireAuth as any, requireSystemAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { enabled, message, eta } = req.body || {};
    const value = JSON.stringify({ enabled: Boolean(enabled), message: message || '', eta: eta || null });

    await prisma.systemSetting.upsert({
      where: { key: 'maintenance_mode' },
      update: { value, updatedById: req.user!.id, updatedByName: req.user!.name },
      create: { key: 'maintenance_mode', value, updatedById: req.user!.id, updatedByName: req.user!.name },
    });

    await auditService.logAction('maintenance_mode_toggled', 'warning', { enabled: Boolean(enabled), message, eta }, {
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      ipAddress: req.ip || 'unknown',
      resource: 'system',
      success: true,
    });

    logger.warn(`[System] Modo de manutencao ${enabled ? 'ATIVADO' : 'desativado'} por ${req.user!.email}`);

    res.status(200).json({ success: true, maintenance: JSON.parse(value) });
  } catch (error) {
    next(error);
  }
});

// CRIAR COPIA DE SEGURANCA MANUAL (Administrador do Sistema)
router.post('/backups', requireAuth as any, requireSystemAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const backup = await BackupService.create();

    await auditService.logAction('DATABASE_BACKUP_CREATED', 'info', { filename: backup.filename, sizeBytes: backup.sizeBytes }, {
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      ipAddress: req.ip || 'unknown',
      resource: 'system',
      success: true,
    });

    res.status(201).json({ success: true, backup });
  } catch (error) {
    next(error);
  }
});

// LISTAR COPIAS DE SEGURANCA EXISTENTES (Administrador do Sistema)
router.get('/backups', requireAuth as any, requireSystemAdmin as any, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const backups = await BackupService.list();
    res.status(200).json({ success: true, backups });
  } catch (error) {
    next(error);
  }
});

// DESCARREGAR UMA COPIA DE SEGURANCA (Administrador do Sistema)
router.get('/backups/:filename/download', requireAuth as any, requireSystemAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const filePath = BackupService.getFilePath(req.params.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Copia de seguranca nao encontrada' });
    }

    await auditService.logAction('DATABASE_BACKUP_DOWNLOADED', 'info', { filename: req.params.filename }, {
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      ipAddress: req.ip || 'unknown',
      resource: 'system',
      success: true,
    });

    res.download(filePath);
  } catch (error) {
    next(error);
  }
});

export default router;
