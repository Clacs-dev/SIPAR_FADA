import { Router, Response, NextFunction } from 'express';
import { requireLicenseModule } from '../middlewares/license';
import { AuthenticatedRequest, requireAuth, requireSystemAdmin } from '../middlewares/auth';
import prisma from '../config/database';
import { auditService } from '../services/audit.service';

const router = Router();
router.use(requireLicenseModule('roles'));

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function roleToResource(role: any) {
  return {
    id: role.id,
    slug: role.slug,
    nome: role.nome,
    descricao: role.descricao,
    sistema: role.sistema,
    total_utilizadores: role._count?.users ?? undefined,
    created_at: role.createdAt?.toISOString?.() || role.createdAt,
    updated_at: role.updatedAt?.toISOString?.() || role.updatedAt,
  };
}

// LISTAR ROLES (Administrador do Sistema)
router.get('/', requireAuth as any, requireSystemAdmin as any, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const roles = await prisma.role.findMany({ where: { deletedAt: null }, orderBy: { nome: 'asc' } });
    const withCounts = await Promise.all(
      roles.map(async (role) => ({
        ...role,
        _count: { users: await prisma.user.count({ where: { role: role.slug } }) },
      }))
    );
    return res.status(200).json({ success: true, roles: withCounts.map(roleToResource) });
  } catch (error) {
    next(error);
  }
});

// OBTER MATRIZ DE PERMISSOES DE UM ROLE (Administrador do Sistema)
router.get('/:id/permissions', requireAuth as any, requireSystemAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const role = await prisma.role.findUnique({
      where: { id: req.params.id },
      include: { permissoes: true },
    });
    if (!role || role.deletedAt) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Role não encontrado' });
    }

    return res.status(200).json({
      success: true,
      role: roleToResource(role),
      permissoes: role.permissoes.map((p) => ({ module: p.module, action: p.action })),
    });
  } catch (error) {
    next(error);
  }
});

// SUBSTITUIR A MATRIZ DE PERMISSOES DE UM ROLE (Administrador do Sistema)
router.put('/:id/permissions', requireAuth as any, requireSystemAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const role = await prisma.role.findUnique({ where: { id: req.params.id } });
    if (!role || role.deletedAt) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Role não encontrado' });
    }

    // As permissões do Administrador do Sistema são fixas: os módulos
    // administrativos (utilizadores, departamentos, roles, auditoria, base de
    // dados, definições, email) continuam protegidos exclusivamente pelo role
    // "admin_sistema" em código (requireSystemAdmin), não pela matriz
    // RolePermission - editar esta matriz para este role não teria qualquer
    // efeito real, e ainda arriscaria bloquear o próprio administrador do
    // sistema fora do painel de administração sem via de recuperação.
    if (role.slug === 'admin_sistema') {
      return res.status(409).json({
        error: 'CONFLICT',
        message: 'As permissões do Administrador do Sistema são fixas e não podem ser alteradas por esta via.',
      });
    }

    const permissoes = Array.isArray(req.body.permissoes) ? req.body.permissoes : [];
    const validRows = permissoes.filter((p: any) => p && typeof p.module === 'string' && typeof p.action === 'string');
    const uniqueRows = Array.from(
      new Map(validRows.map((p: any) => [`${p.module}::${p.action}`, p])).values()
    ) as { module: string; action: string }[];

    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId: role.id } }),
      ...(uniqueRows.length > 0
        ? [prisma.rolePermission.createMany({
            data: uniqueRows.map((p) => ({ roleId: role.id, module: p.module, action: p.action })),
          })]
        : []),
    ]);

    await auditService.logAction('role_permissions_updated', 'info', { roleId: role.id, slug: role.slug, totalPermissoes: uniqueRows.length }, {
      userId: req.user!.id, userEmail: req.user!.email, userRole: req.user!.role,
      resource: 'role', resourceId: role.id, success: true,
    });

    const updated = await prisma.role.findUnique({ where: { id: role.id }, include: { permissoes: true } });
    return res.status(200).json({
      success: true,
      role: roleToResource(updated),
      permissoes: updated!.permissoes.map((p) => ({ module: p.module, action: p.action })),
    });
  } catch (error) {
    next(error);
  }
});

// CRIAR ROLE CUSTOM (Administrador do Sistema)
router.post('/', requireAuth as any, requireSystemAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { nome, descricao } = req.body;
    if (!nome) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'O nome do role é obrigatório' });
    }

    const slug = slugify(nome);
    const existing = await prisma.role.findUnique({ where: { slug } });
    if (existing) {
      return res.status(409).json({ error: 'CONFLICT', message: 'Já existe um role com esse nome' });
    }

    const role = await prisma.role.create({
      data: { slug, nome: nome.trim(), descricao: descricao || null, sistema: false },
    });

    await auditService.logAction('role_created', 'info', { roleId: role.id, slug: role.slug }, {
      userId: req.user!.id, userEmail: req.user!.email, userRole: req.user!.role,
      resource: 'role', resourceId: role.id, success: true,
    });

    return res.status(201).json({ success: true, role: roleToResource(role) });
  } catch (error) {
    next(error);
  }
});

// ACTUALIZAR NOME/DESCRICAO DE UM ROLE (Administrador do Sistema)
router.put('/:id', requireAuth as any, requireSystemAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.role.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.deletedAt) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Role não encontrado' });
    }

    const { nome, descricao } = req.body;
    const role = await prisma.role.update({
      where: { id: req.params.id },
      data: {
        nome: nome !== undefined ? nome.trim() : existing.nome,
        descricao: descricao !== undefined ? descricao : existing.descricao,
      },
    });

    return res.status(200).json({ success: true, role: roleToResource(role) });
  } catch (error) {
    next(error);
  }
});

// ELIMINAR ROLE CUSTOM (Administrador do Sistema) - protege roles de sistema e roles em uso
router.delete('/:id', requireAuth as any, requireSystemAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.role.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.deletedAt) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Role não encontrado' });
    }

    if (existing.sistema) {
      return res.status(409).json({ error: 'CONFLICT', message: 'Roles de sistema não podem ser eliminados, apenas editados' });
    }

    const usersCount = await prisma.user.count({ where: { role: existing.slug } });
    if (usersCount > 0) {
      return res.status(409).json({
        error: 'CONFLICT',
        message: `Não é possível eliminar: ${usersCount} utilizador(es) têm este role. Reatribua-os primeiro.`,
      });
    }

    await prisma.role.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date(), deletedById: req.user!.id, deletedByName: req.user!.name },
    });

    await auditService.logAction('role_deleted', 'warning', { roleId: req.params.id, slug: existing.slug }, {
      userId: req.user!.id, userEmail: req.user!.email, userRole: req.user!.role,
      resource: 'role', resourceId: req.params.id, success: true,
    });

    return res.status(200).json({ success: true, message: 'Role movido para a lixeira' });
  } catch (error) {
    next(error);
  }
});

export default router;
