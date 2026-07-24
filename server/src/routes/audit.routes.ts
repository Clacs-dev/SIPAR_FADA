import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest, requireAuth } from '../middlewares/auth';
import prisma from '../config/database';

const router = Router();

function parseJson(value?: string | null) {
  if (!value) return {};
  try { return JSON.parse(value); } catch { return {}; }
}

function toAudit(record: any) {
  return {
    id: record.id,
    action: record.action,
    severity: record.severity,
    resource: record.resource,
    resourceId: record.resourceId,
    userEmail: record.userEmail,
    userRole: record.userRole,
    success: record.success,
    errorMessage: record.errorMessage,
    metadata: parseJson(record.metadata),
    created_at: record.createdAt.toISOString(),
    timestamp: record.createdAt.toISOString(),
  };
}

router.get('/logs', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(Number(req.query.limit || 100), 500);
    const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
    res.status(200).json({ success: true, logs: logs.map(toAudit) });
  } catch (error) {
    next(error);
  }
});

router.get('/alerts', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const logs = await prisma.auditLog.findMany({
      where: { OR: [{ severity: 'warning' }, { severity: 'error' }, { success: false }] },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    res.status(200).json({ success: true, alerts: logs.map(toAudit) });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', requireAuth as any, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const [total, warnings, errors, failed] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({ where: { severity: 'warning' } }),
      prisma.auditLog.count({ where: { severity: 'error' } }),
      prisma.auditLog.count({ where: { success: false } }),
    ]);
    res.status(200).json({ success: true, stats: { total, warnings, errors, failed } });
  } catch (error) {
    next(error);
  }
});

router.post('/alerts/:id/resolve', requireAuth as any, async (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({ success: true, id: req.params.id, resolved: true });
});

export default router;
