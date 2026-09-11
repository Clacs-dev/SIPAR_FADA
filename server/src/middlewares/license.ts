import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { licenseService, LicenseStatus } from '../services/license.service';
import { auditService } from '../services/audit.service';

const RESTRICTED_MESSAGES: Partial<Record<LicenseStatus, string>> = {
  PENDING: 'A licenca ainda nao foi ativada. Contacte o administrador do sistema.',
  EXPIRED: 'A licenca do sistema expirou. Renove a licenca para continuar a criar/editar registos.',
  SUSPENDED: 'A licenca do sistema esta suspensa. Contacte o fornecedor.',
  REVOKED: 'A licenca do sistema foi revogada. Contacte o fornecedor.',
  INVALID: 'A licenca do sistema e invalida para esta instalacao. Contacte o fornecedor.',
};

/**
 * Gate de licenciamento por modulo, independente do RBAC (hasPermission).
 * Em estados restritos (PENDING/EXPIRED/SUSPENDED/REVOKED/INVALID) permite
 * sempre leitura (GET/HEAD) e exportacao, mas bloqueia qualquer escrita —
 * nunca bloqueia leitura para nao impedir o cliente de exportar os seus
 * proprios dados. Em UNLICENSED (nenhuma licenca ativada ainda) nao bloqueia
 * nada, apenas deixa o banner do frontend visivel.
 */
export function requireLicenseModule(moduleKey: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await licenseService.getCachedValidation();

      if (licenseService.isRestricted(result.status)) {
        if (req.method === 'GET' || req.method === 'HEAD') return next();

        await auditService.logAction(
          'LICENSE_RESTRICTED_ACTION_BLOCKED',
          'warning',
          { moduleKey, status: result.status, method: req.method, path: req.originalUrl },
          { userId: req.user?.id, userEmail: req.user?.email, userRole: req.user?.role, resource: 'license' }
        );

        return res.status(403).json({
          error: 'LICENSE_RESTRICTED',
          message: RESTRICTED_MESSAGES[result.status] || 'Acao bloqueada pelo estado atual da licenca.',
          status: result.status,
        });
      }

      if (!licenseService.moduleIncluded(result, moduleKey)) {
        await auditService.logAction(
          'MODULE_ACCESS_DENIED',
          'warning',
          { moduleKey },
          { userId: req.user?.id, userEmail: req.user?.email, userRole: req.user?.role, resource: 'license' }
        );

        return res.status(403).json({
          error: 'MODULE_NOT_LICENSED',
          message: `O modulo "${moduleKey}" nao esta incluido na licenca atual deste sistema.`,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Gate de licenciamento por feature especifica (ex.: export_pdf,
 * advanced_reports). Usa a mesma politica de restricao que requireLicenseModule.
 */
export function requireLicenseFeature(featureKey: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await licenseService.getCachedValidation();

      if (licenseService.isRestricted(result.status) && req.method !== 'GET' && req.method !== 'HEAD') {
        return res.status(403).json({
          error: 'LICENSE_RESTRICTED',
          message: RESTRICTED_MESSAGES[result.status] || 'Acao bloqueada pelo estado atual da licenca.',
          status: result.status,
        });
      }

      if (!licenseService.featureEnabled(result, featureKey)) {
        return res.status(403).json({
          error: 'FEATURE_NOT_LICENSED',
          message: `A funcionalidade "${featureKey}" nao esta incluida na licenca atual deste sistema.`,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
