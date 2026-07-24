import prisma from '../config/database';
import logger from '../config/logger';

const NON_PERSISTED_USER_IDS = new Set(['publico', 'system']);

function persistedUserId(userId?: string) {
  if (!userId || NON_PERSISTED_USER_IDS.has(userId)) return undefined;
  return userId;
}

export interface AuditLog {
  id: string;
  action: string;
  severity: 'info' | 'warning' | 'error';
  metadata: any;
  context: {
    userId?: string;
    userEmail?: string;
    userRole?: string;
    ipAddress?: string;
    userAgent?: string;
    resource?: string;
    resourceId?: string;
    success?: boolean;
    errorMessage?: string;
    newValue?: any;
    oldValue?: any;
  };
  timestamp: string;
}

export class AuditService {
  static async logAction(
    action: string,
    severity: 'info' | 'warning' | 'error' = 'info',
    metadata: any = {},
    context: Partial<AuditLog['context']> = {}
  ): Promise<AuditLog> {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const timestamp = new Date().toISOString();

    const logEntry: AuditLog = {
      id,
      action,
      severity,
      metadata,
      context: context as AuditLog['context'],
      timestamp,
    };

    try {
      const userId = persistedUserId(context.userId);

      await prisma.auditLog.create({
        data: {
          id,
          userId,
          userEmail: context.userEmail,
          userRole: context.userRole,
          action,
          severity,
          resource: context.resource,
          resourceId: context.resourceId,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          success: context.success,
          errorMessage: context.errorMessage,
          metadata: JSON.stringify(metadata || {}),
          oldValue: context.oldValue === undefined ? undefined : JSON.stringify(context.oldValue),
          newValue: context.newValue === undefined ? undefined : JSON.stringify(context.newValue),
        }
      });

      const message = `[AUDIT] Action: ${action} | Severity: ${severity} | User: ${context.userEmail || 'system'}`;
      if (severity === 'error') logger.error(message, { metadata, context });
      else if (severity === 'warning') logger.warn(message, { metadata, context });
      else logger.info(message, { metadata, context });
    } catch (err) {
      logger.error('Falha ao gravar log de auditoria no banco:', err);
    }

    return logEntry;
  }

  static async getAllLogs(): Promise<AuditLog[]> {
    const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' } });
    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      severity: log.severity as 'info' | 'warning' | 'error',
      metadata: JSON.parse(log.metadata || '{}'),
      context: {
        userId: log.userId || undefined,
        userEmail: log.userEmail || undefined,
        userRole: log.userRole || undefined,
        ipAddress: log.ipAddress || undefined,
        userAgent: log.userAgent || undefined,
        resource: log.resource || undefined,
        resourceId: log.resourceId || undefined,
        success: log.success ?? undefined,
        errorMessage: log.errorMessage || undefined,
        oldValue: log.oldValue ? JSON.parse(log.oldValue) : undefined,
        newValue: log.newValue ? JSON.parse(log.newValue) : undefined,
      },
      timestamp: log.createdAt.toISOString(),
    }));
  }
}

export const auditService = AuditService;
