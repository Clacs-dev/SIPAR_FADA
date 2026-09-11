import { Router, Response, NextFunction } from 'express';
import { requireLicenseModule } from '../middlewares/license';
import { AuthenticatedRequest, requireAuth, requireSystemAdmin } from '../middlewares/auth';
import prisma from '../config/database';
import { auditService } from '../services/audit.service';
import { getUserPermissions, hasPermission, ACTIONS } from '../utils/permissions';

const router = Router();
router.use(requireLicenseModule('audit'));

function parseJson(value?: string | null) {
  if (!value) return {};
  try { return JSON.parse(value); } catch { return {}; }
}

function toAudit(record: any) {
  return {
    id: record.id,
    action: record.action,
    severity: record.severity,
    // Alias de severity - o dashboard de auditoria (frontend) usa "level"
    // para os logs (info/warning/error) e "severity" para os alertas; sao
    // o mesmo valor guardado, so com dois nomes consoante o contexto.
    level: record.severity,
    resource: record.resource,
    resourceId: record.resourceId,
    userEmail: record.userEmail,
    userRole: record.userRole,
    success: record.success,
    errorMessage: record.errorMessage,
    metadata: parseJson(record.metadata),
    details: parseJson(record.metadata),
    resolved: record.resolved,
    resolved_by_name: record.resolvedByName,
    resolved_at: record.resolvedAt?.toISOString?.() || null,
    created_at: record.createdAt.toISOString(),
    timestamp: record.createdAt.toISOString(),
  };
}

const ALERT_WHERE = { OR: [{ severity: 'warning' }, { severity: 'error' }, { success: false }] };

router.get('/logs', requireAuth as any, requireSystemAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(Number(req.query.limit || 100), 500);
    const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
    res.status(200).json({ success: true, logs: logs.map(toAudit) });
  } catch (error) {
    next(error);
  }
});

router.get('/alerts', requireAuth as any, requireSystemAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const logs = await prisma.auditLog.findMany({
      where: ALERT_WHERE,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    res.status(200).json({ success: true, alerts: logs.map(toAudit) });
  } catch (error) {
    next(error);
  }
});

// Formato consumido pelo dashboard de auditoria do frontend
// (AuditDashboard/AuditStats) - tem de devolver exatamente estes campos, no
// nivel de topo (sem wrapper "stats" aninhado), ou o ecra rebenta ao tentar
// iterar campos que nao existem (Object.entries(undefined)).
router.get('/stats', requireAuth as any, requireSystemAdmin as any, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // ultimos 30 dias, para byDay

    const [totalLogs, allAlerts, actionGroups, severityGroups, recent, recentDays] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.findMany({ where: ALERT_WHERE, select: { severity: true, resolved: true } }),
      prisma.auditLog.groupBy({ by: ['action'], _count: { _all: true } }),
      prisma.auditLog.groupBy({ by: ['severity'], _count: { _all: true } }),
      prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.auditLog.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true, severity: true, success: true },
      }),
    ]);

    const totalAlerts = allAlerts.length;
    const unresolvedAlerts = allAlerts.filter((a) => !a.resolved).length;
    // Nao existe um nivel "critical" persistido (severity so admite
    // info/warning/error) - trata-se "error" nao resolvido como critico,
    // que e o pior nivel real que o sistema grava.
    const criticalAlerts = allAlerts.filter((a) => a.severity === 'error' && !a.resolved).length;

    const byAction: Record<string, number> = {};
    for (const group of actionGroups) byAction[group.action] = group._count._all;

    const byLevel: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    for (const group of severityGroups) {
      byLevel[group.severity] = group._count._all;
      bySeverity[group.severity] = group._count._all;
    }

    const byDay: Record<string, { logs: number; alerts: number }> = {};
    for (const row of recentDays) {
      const day = row.createdAt.toISOString().slice(0, 10);
      if (!byDay[day]) byDay[day] = { logs: 0, alerts: 0 };
      byDay[day].logs += 1;
      if (row.severity === 'warning' || row.severity === 'error' || row.success === false) byDay[day].alerts += 1;
    }

    res.status(200).json({
      success: true,
      totalLogs,
      totalAlerts,
      unresolvedAlerts,
      criticalAlerts,
      byAction,
      byLevel,
      bySeverity,
      byDay,
      recentActivity: recent.map(toAudit),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/alerts/:id/resolve', requireAuth as any, requireSystemAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const updated = await prisma.auditLog.update({
      where: { id: req.params.id },
      data: {
        resolved: true,
        resolvedById: req.user!.id,
        resolvedByName: req.user!.name,
        resolvedAt: new Date(),
      },
    });
    res.status(200).json({ success: true, alert: toAudit(updated) });
  } catch (error) {
    next(error);
  }
});

// REGISTAR VISUALIZACAO DE UM REGISTO (qualquer autenticado)
router.post('/view', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { module, resourceId } = req.body;
    if (!module || !resourceId) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'module e resourceId são obrigatórios' });
    }

    await auditService.logAction(`${module}_viewed`, 'info', {}, {
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      ipAddress: req.ip || 'unknown',
      resource: module,
      resourceId,
      success: true,
    });

    return res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

// LISTAR QUEM VISUALIZOU UM REGISTO (requer permissao de leitura total sobre o modulo)
router.get('/views/:module/:resourceId', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { module, resourceId } = req.params;

    if (req.user!.role !== 'admin_sistema') {
      const permissions = await getUserPermissions(req.user!.role);
      if (!hasPermission(permissions, module, ACTIONS.READ_ALL)) {
        return res.status(403).json({ error: 'FORBIDDEN', message: 'Acesso negado - sem permissao de leitura total neste modulo' });
      }
    }

    const logs = await prisma.auditLog.findMany({
      where: { action: `${module}_viewed`, resourceId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    // Uma linha por utilizador, com a visualizacao mais recente
    const seen = new Map<string, any>();
    for (const log of logs) {
      const key = log.userId || log.userEmail || log.id;
      if (!seen.has(key)) {
        seen.set(key, {
          userId: log.userId,
          userEmail: log.userEmail,
          userRole: log.userRole,
          viewed_at: log.createdAt.toISOString(),
          total_visualizacoes: 1,
        });
      } else {
        seen.get(key).total_visualizacoes += 1;
      }
    }

    return res.status(200).json({ success: true, visualizacoes: Array.from(seen.values()) });
  } catch (error) {
    next(error);
  }
});

export default router;
