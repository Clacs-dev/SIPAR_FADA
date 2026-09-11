import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import { AuthenticatedRequest, requireAuth, requireSystemAdmin } from '../middlewares/auth';
import { licenseService, LicenseError } from '../services/license.service';
import prisma from '../config/database';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1 * 1024 * 1024 } });

function handleLicenseError(error: unknown, res: Response, next: NextFunction) {
  if (error instanceof LicenseError) {
    return res.status(400).json({ error: error.code, message: error.message });
  }
  next(error);
}

// ATIVAR / RENOVAR — aceita o ficheiro de licenca (.lic) e/ou o certificado
// de ativacao (.cert) no mesmo pedido multipart (Administrador do Sistema)
router.post(
  '/activate',
  requireAuth as any,
  requireSystemAdmin as any,
  upload.fields([
    { name: 'license', maxCount: 1 },
    { name: 'certificate', maxCount: 1 },
  ]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;
      const licenseFile = files?.license?.[0];
      const certFile = files?.certificate?.[0];

      if (!licenseFile && !certFile) {
        return res.status(400).json({ error: 'BAD_REQUEST', message: 'Carregue o ficheiro de licenca (.lic) e/ou o certificado de ativacao (.cert).' });
      }

      const ctx = { userId: req.user!.id, userEmail: req.user!.email, userRole: req.user!.role };

      if (licenseFile) {
        await licenseService.uploadLicense(licenseFile.buffer.toString('utf-8'), ctx);
      }
      if (certFile) {
        await licenseService.uploadActivationCertificate(certFile.buffer.toString('utf-8'), ctx);
      }

      const result = await licenseService.validate();
      const fingerprint = await licenseService.computeFingerprint();

      return res.status(200).json({ success: true, ...result, fingerprint });
    } catch (error) {
      handleLicenseError(error, res, next);
    }
  }
);

// REVALIDAR MANUALMENTE (obtem CRL se online, recalcula o estado) — Administrador do Sistema
router.post('/refresh', requireAuth as any, requireSystemAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await licenseService.fetchRevocationList();
    const result = await licenseService.validate();
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

// ESTADO ATUAL — qualquer utilizador autenticado (alimenta o banner de licenca)
router.get('/status', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await licenseService.getCachedValidation();
    const isAdmin = req.user?.role === 'admin_sistema';
    const fingerprint = isAdmin ? await licenseService.computeFingerprint() : undefined;
    return res.status(200).json({ success: true, ...result, fingerprint });
  } catch (error) {
    next(error);
  }
});

// FINGERPRINT DA INSTALACAO — Administrador do Sistema (usado no round-trip de ativacao)
router.get('/fingerprint', requireAuth as any, requireSystemAdmin as any, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const fingerprint = await licenseService.computeFingerprint();
    return res.status(200).json({ success: true, fingerprint });
  } catch (error) {
    next(error);
  }
});

// HISTORICO DE EVENTOS DE LICENCA — Administrador do Sistema
router.get('/history', requireAuth as any, requireSystemAdmin as any, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { resource: 'license' },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return res.status(200).json({
      success: true,
      history: logs.map((log) => ({
        id: log.id,
        action: log.action,
        severity: log.severity,
        resourceId: log.resourceId,
        userEmail: log.userEmail,
        success: log.success,
        metadata: log.metadata ? JSON.parse(log.metadata) : {},
        createdAt: log.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
