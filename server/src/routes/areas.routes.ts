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

function areaToResource(area: any) {
  return {
    id: area.id,
    nome: area.nome,
    slug: area.slug,
    departamento_id: area.departmentId,
    departamento_nome: area.department?.nome,
    descricao: area.descricao,
    activo: area.activo,
    total_utilizadores: area._count?.users ?? undefined,
    created_at: area.createdAt?.toISOString?.() || area.createdAt,
    updated_at: area.updatedAt?.toISOString?.() || area.updatedAt,
  };
}

// LISTAR (qualquer autenticado - usado em dropdowns de atribuicao), opcionalmente filtrado por departamento
router.get('/', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const includeInactive = req.query.all === 'true';
    const { departmentId } = req.query as Record<string, string>;

    const areas = await prisma.area.findMany({
      where: {
        ...(includeInactive ? {} : { activo: true }),
        ...(departmentId ? { departmentId } : {}),
        deletedAt: null,
      },
      include: { _count: { select: { users: true } }, department: { select: { nome: true } } },
      orderBy: { nome: 'asc' },
    });

    return res.status(200).json({ success: true, areas: areas.map(areaToResource) });
  } catch (error) {
    next(error);
  }
});

// CRIAR (Administrador do Sistema)
router.post('/', requireAuth as any, requireSystemAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { nome, departmentId, descricao, activo } = req.body;
    if (!nome || !departmentId) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'O nome e o departamento são obrigatórios' });
    }

    const department = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!department || department.deletedAt) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Departamento não encontrado' });
    }

    const slug = slugify(nome);
    const existing = await prisma.area.findUnique({ where: { departmentId_slug: { departmentId, slug } } });
    if (existing) {
      return res.status(409).json({ error: 'CONFLICT', message: 'Já existe uma área com esse nome neste departamento' });
    }

    const area = await prisma.area.create({
      data: {
        nome: nome.trim(),
        slug,
        departmentId,
        descricao: descricao || null,
        activo: activo !== undefined ? Boolean(activo) : true,
      },
      include: { department: { select: { nome: true } } },
    });

    await auditService.logAction('area_created', 'info', { areaId: area.id, nome: area.nome, departmentId }, {
      userId: req.user!.id, userEmail: req.user!.email, userRole: req.user!.role,
      resource: 'area', resourceId: area.id, success: true,
    });

    return res.status(201).json({ success: true, area: areaToResource(area) });
  } catch (error) {
    next(error);
  }
});

// ACTUALIZAR (Administrador do Sistema)
router.put('/:id', requireAuth as any, requireSystemAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.area.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.deletedAt) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Área não encontrada' });
    }

    const { nome, departmentId, descricao, activo } = req.body;

    if (departmentId && departmentId !== existing.departmentId) {
      const department = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!department || department.deletedAt) {
        return res.status(400).json({ error: 'BAD_REQUEST', message: 'Departamento não encontrado' });
      }
    }

    const area = await prisma.area.update({
      where: { id: req.params.id },
      data: {
        nome: nome !== undefined ? nome.trim() : existing.nome,
        slug: nome !== undefined ? slugify(nome) : existing.slug,
        departmentId: departmentId !== undefined ? departmentId : existing.departmentId,
        descricao: descricao !== undefined ? descricao : existing.descricao,
        activo: activo !== undefined ? Boolean(activo) : existing.activo,
      },
      include: { department: { select: { nome: true } } },
    });

    await auditService.logAction('area_updated', 'info', { areaId: area.id, changes: req.body }, {
      userId: req.user!.id, userEmail: req.user!.email, userRole: req.user!.role,
      resource: 'area', resourceId: area.id, success: true,
    });

    return res.status(200).json({ success: true, area: areaToResource(area) });
  } catch (error) {
    next(error);
  }
});

// ELIMINAR (Administrador do Sistema) - bloqueia se houver utilizadores associados
router.delete('/:id', requireAuth as any, requireSystemAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.area.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.deletedAt) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Área não encontrada' });
    }

    const usersCount = await prisma.user.count({ where: { areaId: req.params.id } });
    if (usersCount > 0) {
      return res.status(409).json({
        error: 'CONFLICT',
        message: `Não é possível eliminar: ${usersCount} utilizador(es) estão associados a esta área. Reatribua-os primeiro.`,
      });
    }

    await prisma.area.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date(), deletedById: req.user!.id, deletedByName: req.user!.name },
    });

    await auditService.logAction('area_deleted', 'warning', { areaId: req.params.id, nome: existing.nome }, {
      userId: req.user!.id, userEmail: req.user!.email, userRole: req.user!.role,
      resource: 'area', resourceId: req.params.id, success: true,
    });

    return res.status(200).json({ success: true, message: 'Área movida para a lixeira' });
  } catch (error) {
    next(error);
  }
});

export default router;
