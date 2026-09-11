import { Router, Response, NextFunction } from 'express';
import { requireLicenseModule } from '../middlewares/license';
import { AuthenticatedRequest, requireAuth, requireSystemAdmin } from '../middlewares/auth';
import prisma from '../config/database';
import { auditService } from '../services/audit.service';

const router = Router();
router.use(requireLicenseModule('departments'));

const DIACRITICS_REGEX = new RegExp('[̀-ͯ]', 'g');

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD').replace(DIACRITICS_REGEX, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function deptToResource(dept: any) {
  return {
    id: dept.id,
    nome: dept.nome,
    slug: dept.slug,
    categoria: dept.categoria,
    descricao: dept.descricao,
    cor: dept.cor,
    activo: dept.activo,
    total_utilizadores: dept._count?.users ?? undefined,
    created_at: dept.createdAt?.toISOString?.() || dept.createdAt,
    updated_at: dept.updatedAt?.toISOString?.() || dept.updatedAt,
  };
}

// LISTAR (qualquer autenticado - usado em dropdowns de atribuicao)
router.get('/', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const includeInactive = req.query.all === 'true';
    const departments = await prisma.department.findMany({
      where: { ...(includeInactive ? {} : { activo: true }), deletedAt: null },
      include: { _count: { select: { users: true } } },
      orderBy: { nome: 'asc' },
    });
    return res.status(200).json({ success: true, departamentos: departments.map(deptToResource) });
  } catch (error) {
    next(error);
  }
});

// ESTATISTICAS REAIS POR DEPARTAMENTO (qualquer autenticado com acesso aos
// dashboards/relatorios departamentais - executivos e Administrador do Sistema)
router.get('/stats', requireAuth as any, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const departments = await prisma.department.findMany({
      where: { activo: true, deletedAt: null },
      orderBy: { nome: 'asc' },
    });

    const stats = await Promise.all(departments.map(async (dept) => {
      const [
        totalUsers,
        activeUsers,
        facturasCount,
        procurementsCount,
        actasCount,
        comunicacoesCount,
        meetingsCount,
        facturasPendentes,
        procurementsPendentes,
        actasPendentes,
        facturasValorAgregado,
      ] = await Promise.all([
        prisma.user.count({ where: { departmentId: dept.id } }),
        prisma.user.count({ where: { departmentId: dept.id, status: 'active' } }),
        prisma.factura.count({ where: { createdBy: { departmentId: dept.id } } }),
        prisma.procurement.count({ where: { createdBy: { departmentId: dept.id } } }),
        prisma.acta.count({ where: { createdBy: { departmentId: dept.id } } }),
        prisma.comunicacao.count({ where: { createdBy: { departmentId: dept.id } } }),
        prisma.internalMeeting.count({ where: { organizer: { departmentId: dept.id } } }),
        prisma.factura.count({ where: { createdBy: { departmentId: dept.id }, status: 'pendente' } }),
        prisma.procurement.count({ where: { createdBy: { departmentId: dept.id }, status: 'pendente' } }),
        prisma.acta.count({ where: { createdBy: { departmentId: dept.id }, status: { in: ['rascunho', 'pendente'] } } }),
        prisma.factura.aggregate({ where: { createdBy: { departmentId: dept.id } }, _sum: { valor: true } }),
      ]);

      return {
        department_id: dept.id,
        department_slug: dept.slug,
        department_nome: dept.nome,
        categoria: dept.categoria,
        total_users: totalUsers,
        active_users: activeUsers,
        facturas_count: facturasCount,
        facturas_value: facturasValorAgregado._sum.valor || 0,
        procurements_count: procurementsCount,
        actas_count: actasCount,
        comunicacoes_count: comunicacoesCount,
        meetings_count: meetingsCount,
        pending_count: facturasPendentes + procurementsPendentes + actasPendentes,
      };
    }));

    return res.status(200).json({ success: true, stats });
  } catch (error) {
    next(error);
  }
});

// CRIAR (Administrador do Sistema)
router.post('/', requireAuth as any, requireSystemAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { nome, categoria, descricao, cor, activo } = req.body;
    if (!nome) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'O nome do departamento é obrigatório' });
    }

    const slug = slugify(nome);
    const existing = await prisma.department.findUnique({ where: { slug } });
    if (existing) {
      return res.status(409).json({ error: 'CONFLICT', message: 'Já existe um departamento com esse nome' });
    }

    const dept = await prisma.department.create({
      data: {
        nome: nome.trim(),
        slug,
        categoria: categoria || null,
        descricao: descricao || null,
        cor: cor || null,
        activo: activo !== undefined ? Boolean(activo) : true,
      },
    });

    await auditService.logAction('department_created', 'info', { departmentId: dept.id, nome: dept.nome }, {
      userId: req.user!.id, userEmail: req.user!.email, userRole: req.user!.role,
      resource: 'department', resourceId: dept.id, success: true,
    });

    return res.status(201).json({ success: true, departamento: deptToResource(dept) });
  } catch (error) {
    next(error);
  }
});

// ACTUALIZAR (Administrador do Sistema)
router.put('/:id', requireAuth as any, requireSystemAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.department.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.deletedAt) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Departamento não encontrado' });
    }

    const { nome, categoria, descricao, cor, activo } = req.body;

    const dept = await prisma.department.update({
      where: { id: req.params.id },
      data: {
        nome: nome !== undefined ? nome.trim() : existing.nome,
        slug: nome !== undefined ? slugify(nome) : existing.slug,
        categoria: categoria !== undefined ? categoria : existing.categoria,
        descricao: descricao !== undefined ? descricao : existing.descricao,
        cor: cor !== undefined ? cor : existing.cor,
        activo: activo !== undefined ? Boolean(activo) : existing.activo,
      },
    });

    await auditService.logAction('department_updated', 'info', { departmentId: dept.id, changes: req.body }, {
      userId: req.user!.id, userEmail: req.user!.email, userRole: req.user!.role,
      resource: 'department', resourceId: dept.id, success: true,
    });

    return res.status(200).json({ success: true, departamento: deptToResource(dept) });
  } catch (error) {
    next(error);
  }
});

// ELIMINAR (Administrador do Sistema) - bloqueia se houver utilizadores associados
router.delete('/:id', requireAuth as any, requireSystemAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.department.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.deletedAt) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Departamento não encontrado' });
    }

    const usersCount = await prisma.user.count({ where: { departmentId: req.params.id } });
    if (usersCount > 0) {
      return res.status(409).json({
        error: 'CONFLICT',
        message: `Não é possível eliminar: ${usersCount} utilizador(es) estão associados a este departamento. Reatribua-os primeiro.`,
      });
    }

    await prisma.department.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date(), deletedById: req.user!.id, deletedByName: req.user!.name },
    });

    await auditService.logAction('department_deleted', 'warning', { departmentId: req.params.id, nome: existing.nome }, {
      userId: req.user!.id, userEmail: req.user!.email, userRole: req.user!.role,
      resource: 'department', resourceId: req.params.id, success: true,
    });

    return res.status(200).json({ success: true, message: 'Departamento movido para a lixeira' });
  } catch (error) {
    next(error);
  }
});

export default router;
