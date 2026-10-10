import { Router, Response, NextFunction } from 'express';
import { requireLicenseModule } from '../middlewares/license';
import { licenseService } from '../services/license.service';
import { AuthenticatedRequest, requireAuth, requireSystemAdmin } from '../middlewares/auth';
import prisma from '../config/database';
import bcrypt from 'bcryptjs';
import { auditService } from '../services/audit.service';
import { contarExtraccoesIa, definirLimiteDoUtilizador, obterLimiteDoUtilizador } from '../services/extraccao-regras.service';

const router = Router();
router.use(requireLicenseModule('users'));

// LISTAR TODOS OS UTILIZADORES INTERNOS ATIVOS (staff interno - necessário para agendamentos)
router.get('/', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { roles, excludeId } = req.query;

    // Utilizadores externos (publico) nao devem ver o directorio interno de funcionarios
    if (user.role === 'externo') {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Sem permissao para listar utilizadores' });
    }

    const dbUsers = await prisma.user.findMany({
      where: {
        status: 'active',
        role: { not: 'externo' },
      }
    });

    let usersList = dbUsers;

    // Filtrar por roles
    if (roles) {
      const requestedRoles = (roles as string).split(',').map(r => r.trim());
      usersList = usersList.filter(u => requestedRoles.includes(u.role));
    }

    // Excluir id específico
    if (excludeId) {
      usersList = usersList.filter(u => u.id !== excludeId);
    }

    // Formato de resposta simplificado esperado pelo frontend
    const usersResponse = usersList.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      position: u.position,
      department: u.department,
      document: u.document,
    }));

    return res.status(200).json({ data: usersResponse });
  } catch (error) {
    next(error);
  }
});

// LISTAR TODOS OS UTILIZADORES (Apenas Administrador do Sistema)
router.get('/all', requireAuth as any, requireSystemAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const dbUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { departmentRef: true },
    });

    const enrichedUsers = dbUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      department: u.department,
      department_id: u.departmentId,
      department_nome: u.departmentRef?.nome || null,
      position: u.position,
      phone: u.phone,
      organization: u.organization,
      document: u.document,
      created_at: u.createdAt.toISOString(),
      last_login: u.lastLogin?.toISOString() || null,
    }));

    return res.status(200).json({ success: true, users: enrichedUsers });
  } catch (error) {
    next(error);
  }
});

// CRIAR UTILIZADOR MANUALLY (Apenas Administrador do Sistema)
router.post('/create', requireAuth as any, requireSystemAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    const {
      name,
      email,
      password,
      role,
      organization,
      phone,
      department,
      departmentId,
      position,
      address,
      document
    } = req.body;

    if (!name || !email || !password || !role || !organization || !phone || !document) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Todos os campos obrigatórios devem ser preenchidos' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verificar e-mail duplicado
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existing) {
      return res.status(409).json({ error: 'EMAIL_DUPLICADO', message: 'Este e-mail já está registrado no sistema' });
    }

    const userLimit = await licenseService.checkUserLimit(role === 'admin_sistema' ? 'admin' : 'user');
    if (!userLimit.allowed) {
      await auditService.logAction(
        'LICENSE_USER_LIMIT_REACHED',
        'warning',
        { current: userLimit.current, max: userLimit.max, role },
        { userId: req.user?.id, userEmail: req.user?.email, userRole: req.user?.role, resource: 'license', success: false }
      );
      return res.status(403).json({
        error: 'LICENSE_USER_LIMIT_REACHED',
        message: `O limite de ${userLimit.max} utilizador(es) da licenca atual foi atingido (${userLimit.current}/${userLimit.max}). Contacte o administrador para rever a licenca.`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: name.trim(),
        role,
        organization: organization.trim(),
        phone,
        department: department?.trim() || '',
        departmentId: departmentId || null,
        position: position?.trim() || '',
        address: address?.trim() || '',
        document,
        status: 'active', // criados por admin nascem ativos
      }
    });

    // Auditoria
    await auditService.logAction(
      'user_created_by_admin',
      'info',
      { createdUserId: newUser.id, createdUserRole: role, duration: Date.now() - startTime },
      {
        userId: req.user!.id,
        userEmail: req.user!.email,
        userRole: req.user!.role,
        ipAddress,
        userAgent,
        success: true,
        resource: 'user',
        resourceId: newUser.id
      }
    );

    return res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      },
      message: 'Utilizador criado com sucesso pelo administrador.'
    });

  } catch (error) {
    next(error);
  }
});

// ATUALIZAR ROLE/DEPARTAMENTO/CARGO DO UTILIZADOR (Apenas Administrador do Sistema)
router.put('/:userId', requireAuth as any, requireSystemAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { name, role, departmentId, position, email, password, phone, organization } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Utilizador não encontrado' });
    }

    // Trocar o e-mail (login): formato valido e sem duplicados.
    let normalizedEmail: string | undefined;
    if (typeof email === 'string' && email.trim() && email.trim().toLowerCase() !== existingUser.email) {
      normalizedEmail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({ error: 'BAD_REQUEST', message: 'E-mail inválido' });
      }
      const outro = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (outro) {
        return res.status(409).json({ error: 'EMAIL_DUPLICADO', message: 'Este e-mail já está registado no sistema' });
      }
    }

    // Nova senha definida pelo administrador (vazio = manter a actual).
    let hashedPassword: string | undefined;
    if (typeof password === 'string' && password.length > 0) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'BAD_REQUEST', message: 'A senha deve ter no mínimo 6 caracteres' });
      }
      hashedPassword = await bcrypt.hash(password, 10);
    }

    if (role) {
      const roleExists = await prisma.role.findUnique({ where: { slug: role } });
      if (!roleExists) {
        return res.status(400).json({ error: 'BAD_REQUEST', message: `Role "${role}" não existe` });
      }
    }

    let departmentNome: string | undefined;
    if (departmentId !== undefined) {
      if (departmentId) {
        const dept = await prisma.department.findUnique({ where: { id: departmentId } });
        if (!dept) {
          return res.status(400).json({ error: 'BAD_REQUEST', message: 'Departamento não encontrado' });
        }
        departmentNome = dept.nome;
      } else {
        departmentNome = '';
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(role !== undefined ? { role } : {}),
        ...(departmentId !== undefined ? { departmentId: departmentId || null, department: departmentNome } : {}),
        ...(position !== undefined ? { position: position.trim() } : {}),
        ...(phone !== undefined ? { phone: String(phone).trim() } : {}),
        ...(organization !== undefined ? { organization: String(organization).trim() } : {}),
        ...(normalizedEmail ? { email: normalizedEmail } : {}),
        ...(hashedPassword ? { password: hashedPassword } : {}),
      },
      include: { departmentRef: true },
    });

    // Credenciais alteradas: termina as sessoes abertas desse utilizador.
    if (normalizedEmail || hashedPassword) {
      await prisma.userSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }).catch(() => null);
    }

    await auditService.logAction(
      'user_updated_by_system_admin',
      'info',
      { targetUserId: userId, changes: { role, departmentId, position, name, phone, organization, email: normalizedEmail, passwordChanged: !!hashedPassword } },
      {
        userId: req.user!.id,
        userEmail: req.user!.email,
        userRole: req.user!.role,
        success: true,
        resource: 'user',
        resourceId: userId,
      }
    );

    return res.status(200).json({
      success: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        department: updated.department,
        department_id: updated.departmentId,
        department_nome: updated.departmentRef?.nome || null,
        position: updated.position,
        phone: updated.phone,
        organization: updated.organization,
        status: updated.status,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ATUALIZAR STATUS DO UTILIZADOR (Apenas Administrador do Sistema)
// LIMITE DE EXTRACCOES DE FACTURAS COM IA DO UTILIZADOR (Administrador do Sistema)
// limite null = sem limite, 0 = nenhuma; periodo "mensal" | "total".
router.get('/:userId/limite-extraccao-ia', requireAuth as any, requireSystemAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const alvo = await prisma.user.findUnique({ where: { id: req.params.userId }, select: { id: true } });
    if (!alvo) return res.status(404).json({ error: 'NOT_FOUND', message: 'Utilizador não encontrado' });
    const limite = await obterLimiteDoUtilizador(alvo.id);
    const usadas = await contarExtraccoesIa(alvo.id, limite.periodo);
    return res.status(200).json({ success: true, ...limite, usadas });
  } catch (error) {
    next(error);
  }
});

router.put('/:userId/limite-extraccao-ia', requireAuth as any, requireSystemAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const alvo = await prisma.user.findUnique({ where: { id: req.params.userId }, select: { id: true, email: true } });
    if (!alvo) return res.status(404).json({ error: 'NOT_FOUND', message: 'Utilizador não encontrado' });
    const limite = await definirLimiteDoUtilizador(alvo.id, req.body, { id: req.user!.id, name: req.user!.name });
    await auditService.logAction('user_limite_extraccao_ia_updated', 'info', { alvoId: alvo.id, alvoEmail: alvo.email, ...limite }, {
      userId: req.user!.id, userEmail: req.user!.email, userRole: req.user!.role,
      resource: 'user', resourceId: alvo.id, success: true,
    });
    const usadas = await contarExtraccoesIa(alvo.id, limite.periodo);
    return res.status(200).json({ success: true, ...limite, usadas });
  } catch (error) {
    next(error);
  }
});

router.put('/:userId/status', requireAuth as any, requireSystemAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['active', 'pending', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Status inválido' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Utilizador não encontrado' });
    }

    const oldStatus = existingUser.status;

    // Atualizar no SQL
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status }
    });

    // Auditoria
    await auditService.logAction(
      'user_status_updated',
      'info',
      { targetUserId: userId, oldStatus, newStatus: status, updatedBy: req.user!.id },
      {
        userId: req.user!.id,
        userEmail: req.user!.email,
        userRole: req.user!.role,
        success: true,
        resource: 'user',
        resourceId: userId
      }
    );

    return res.status(200).json({ success: true, user: updated });
  } catch (error) {
    next(error);
  }
});

// ELIMINAR UTILIZADOR (Apenas Administrador do Sistema)
// Apaga a conta de vez. Os documentos que criou ficam (createdById passa a
// null, o nome continua gravado em createdByName); as sessoes, mensagens e
// notificacoes dele sao removidas. Se organizou reunioes internas, recusa-se
// (seriam apagadas em cascata) - nesse caso deve ser desactivado.
router.delete('/:userId', requireAuth as any, requireSystemAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    if (userId === req.user!.id) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Não pode eliminar a sua própria conta.' });
    }
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Utilizador não encontrado' });
    }
    if (existingUser.role === 'admin_sistema') {
      const outrosAdmins = await prisma.user.count({ where: { role: 'admin_sistema', status: 'active', id: { not: userId } } });
      if (outrosAdmins === 0) {
        return res.status(400).json({ error: 'BAD_REQUEST', message: 'Não pode eliminar o último Administrador do Sistema activo.' });
      }
    }
    const reunioes = await prisma.internalMeeting.count({ where: { organizerId: userId } });
    if (reunioes > 0) {
      return res.status(409).json({
        error: 'TEM_REUNIOES',
        message: `Este utilizador organizou ${reunioes} reunião(ões) interna(s), que seriam apagadas com ele. Desactive a conta em vez de a eliminar.`,
      });
    }

    await prisma.user.delete({ where: { id: userId } });

    await auditService.logAction(
      'user_deleted_by_system_admin',
      'warning',
      { targetUserId: userId, email: existingUser.email, name: existingUser.name, role: existingUser.role },
      {
        userId: req.user!.id,
        userEmail: req.user!.email,
        userRole: req.user!.role,
        ipAddress: req.ip || 'unknown',
        success: true,
        resource: 'user',
        resourceId: userId,
      }
    );

    return res.status(200).json({ success: true, message: 'Utilizador eliminado' });
  } catch (error) {
    next(error);
  }
});

export default router;
