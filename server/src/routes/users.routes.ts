import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest, requireAuth, requireAdmin } from '../middlewares/auth';
import prisma from '../config/database';
import bcrypt from 'bcryptjs';
import { auditService } from '../services/audit.service';

const router = Router();

// LISTAR TODOS OS USUÁRIOS ATIVOS (Qualquer logado - necessário para agendamentos)
router.get('/', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { roles, excludeId } = req.query;

    const dbUsers = await prisma.user.findMany({
      where: {
        status: 'active'
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
      role: u.role
    }));

    return res.status(200).json({ data: usersResponse });
  } catch (error) {
    next(error);
  }
});

// LISTAR TODOS OS UTILIZADORES (Apenas Admin)
router.get('/all', requireAuth as any, requireAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const dbUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const enrichedUsers = dbUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      department: u.department,
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

// CRIAR UTILIZADOR MANUALLY (Apenas Admin)
router.post('/create', requireAuth as any, requireAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

// ATUALIZAR STATUS DO UTILIZADOR (Apenas Admin)
router.put('/:userId/status', requireAuth as any, requireAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

export default router;
