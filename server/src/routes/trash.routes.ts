import { Router, Response, NextFunction } from 'express';
import { requireLicenseModule } from '../middlewares/license';
import { AuthenticatedRequest, requireAuth, requireSystemAdmin } from '../middlewares/auth';
import prisma from '../config/database';
import { auditService } from '../services/audit.service';

const router = Router();
router.use(requireLicenseModule('settings'));

interface TrashModuleConfig {
  key: string;
  displayName: string;
  delegate: () => any;
  label: (record: any) => string;
}

// Modulos com eliminacao suave (deletedAt): os 7 modulos genericos geridos
// por ModuleRoutesHelper (presentation/audience/factura/fornecedor/
// procurement/comunicacao/acta) mais os 3 modelos de administracao
// (department/role/area) introduzidos junto com o resto do admin_sistema.
// Reunioes internas e salas de reuniao continuam com eliminacao definitiva
// (rotas proprias, fora do ModuleRoutesHelper) e nao aparecem aqui.
const TRASH_MODULES: TrashModuleConfig[] = [
  {
    key: 'presentation',
    displayName: 'Carta de apresentação',
    delegate: () => prisma.presentation,
    label: (r) => r.company || r.purpose || r.id,
  },
  {
    key: 'audience',
    displayName: 'Pedido de audiência',
    delegate: () => prisma.audience,
    label: (r) => r.requestorName || r.organization || r.id,
  },
  {
    key: 'comunicacao',
    displayName: 'Comunicação',
    delegate: () => prisma.comunicacao,
    label: (r) => r.titulo || r.assunto || r.id,
  },
  {
    key: 'acta',
    displayName: 'Acta',
    delegate: () => prisma.acta,
    label: (r) => [r.numero, r.assunto].filter(Boolean).join(' — ') || r.id,
  },
  {
    key: 'factura',
    displayName: 'Factura',
    delegate: () => prisma.factura,
    label: (r) => [r.numero, r.fornecedor].filter(Boolean).join(' — ') || r.id,
  },
  {
    key: 'fornecedor',
    displayName: 'Fornecedor',
    delegate: () => prisma.fornecedor,
    label: (r) => r.nome || r.id,
  },
  {
    key: 'procurement',
    displayName: 'Processo de compras',
    delegate: () => prisma.procurement,
    label: (r) => [r.numero, r.descricao].filter(Boolean).join(' — ') || r.id,
  },
  {
    key: 'role',
    displayName: 'Role',
    delegate: () => prisma.role,
    label: (r) => r.nome || r.slug || r.id,
  },
  {
    key: 'department',
    displayName: 'Departamento',
    delegate: () => prisma.department,
    label: (r) => r.nome || r.id,
  },
  {
    key: 'area',
    displayName: 'Área',
    delegate: () => prisma.area,
    label: (r) => r.nome || r.id,
  },
];

function findModuleConfig(key: string) {
  return TRASH_MODULES.find((m) => m.key === key);
}

// LISTAR TUDO NA LIXEIRA (Administrador do Sistema)
router.get('/', requireAuth as any, requireSystemAdmin as any, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const results = await Promise.all(
      TRASH_MODULES.map(async (config) => {
        const records = await config.delegate().findMany({ where: { deletedAt: { not: null } } });
        return records.map((record: any) => ({
          module: config.key,
          moduleDisplayName: config.displayName,
          id: record.id,
          label: config.label(record),
          deletedAt: record.deletedAt,
          deletedById: record.deletedById,
          deletedByName: record.deletedByName,
        }));
      })
    );

    const items = results.flat().sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());

    return res.status(200).json({ success: true, items, total: items.length });
  } catch (error) {
    next(error);
  }
});

// RESTAURAR UM REGISTO (Administrador do Sistema)
router.post('/:module/:id/restore', requireAuth as any, requireSystemAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const config = findModuleConfig(req.params.module);
    if (!config) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Módulo inválido' });
    }

    const existing = await config.delegate().findUnique({ where: { id: req.params.id } });
    if (!existing || !existing.deletedAt) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Registo não encontrado na lixeira' });
    }

    const restored = await config.delegate().update({
      where: { id: req.params.id },
      data: { deletedAt: null, deletedById: null, deletedByName: null },
    });

    await auditService.logAction(`${config.key}_restored`, 'info', { resourceId: req.params.id, label: config.label(existing) }, {
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      ipAddress: req.ip || 'unknown',
      resource: config.key,
      resourceId: req.params.id,
      success: true,
    });

    return res.status(200).json({ success: true, message: `${config.displayName} restaurado com sucesso`, item: restored });
  } catch (error) {
    next(error);
  }
});

// ELIMINAR DEFINITIVAMENTE (Administrador do Sistema) - exige que ja esteja na lixeira
router.delete('/:module/:id', requireAuth as any, requireSystemAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const config = findModuleConfig(req.params.module);
    if (!config) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Módulo inválido' });
    }

    const existing = await config.delegate().findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Registo não encontrado' });
    }
    if (!existing.deletedAt) {
      return res.status(409).json({
        error: 'CONFLICT',
        message: 'Este registo ainda não está na lixeira. Elimine-o primeiro no módulo de origem.',
      });
    }

    await auditService.logAction(`${config.key}_permanently_deleted`, 'warning', { resourceId: req.params.id, label: config.label(existing) }, {
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      ipAddress: req.ip || 'unknown',
      resource: config.key,
      resourceId: req.params.id,
      oldValue: existing,
      success: true,
    });

    await config.delegate().delete({ where: { id: req.params.id } });

    return res.status(200).json({ success: true, message: `${config.displayName} eliminado definitivamente` });
  } catch (error) {
    next(error);
  }
});

export default router;
